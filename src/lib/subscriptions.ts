import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { getStripeClient, getSiteUrl, getSubscriptionPriceId, planKeyFromPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { generateInvoiceNumber } from "@/lib/utils";
import {
  SUBSCRIPTION_PLANS,
  STATUTORY_FEE_PER_ACT_CENTS,
  allocateOverage,
  isSubscriptionPlanKey,
  planDisplayName,
  type SubscriptionPlanKey,
} from "@/lib/plans";

/**
 * Create or get a Stripe customer for a client
 */
export async function getOrCreateStripeCustomer(
  client: { id: string; email: string; name: string }
) {
  const stripe = getStripeClient();
  if (!stripe) return null;

  // Reuse only a customer that was created for THIS client. Matching on
  // email alone could hand one account another account's Stripe customer
  // (e.g. a person whose email is also a business's billing email).
  if (client.email) {
    const existing = await stripe.customers.list({ email: client.email, limit: 20 });
    const mine = existing.data.find((c) => c.metadata?.clientId === client.id);
    if (mine) return mine;
  }

  return await stripe.customers.create({
    email: client.email,
    name: client.name,
    metadata: { clientId: client.id },
  });
}

/**
 * Create or get a Stripe customer for a business
 */
export async function getOrCreateStripeCustomerForBusiness(
  business: { id: string; email: string; companyName: string }
) {
  const stripe = getStripeClient();
  if (!stripe) return null;

  // Reuse only a customer created for THIS business (metadata match), never
  // one that merely shares an email — otherwise two businesses with the same
  // billing email would see each other's subscriptions in the Stripe portal.
  if (business.email) {
    const existing = await stripe.customers.list({ email: business.email, limit: 20 });
    const mine = existing.data.find((c) => c.metadata?.businessId === business.id);
    if (mine) return mine;
  }

  return await stripe.customers.create({
    email: business.email,
    name: business.companyName,
    metadata: { businessId: business.id },
  });
}

/**
 * Create a Stripe Checkout session for a one-time individual appointment payment
 */
export async function createIndividualCheckoutSession(input: {
  clientId: string;
  clientEmail: string;
  clientName: string;
  appointmentId: string;
  invoiceId?: string;
  totalAmountCents: number;
  serviceType: string;
}): Promise<{ sessionId: string; customerId: string } | null> {
  const stripe = getStripeClient();
  if (!stripe) return null;

  const priceId = process.env.STRIPE_PRICE_INDIVIDUAL;
  if (!priceId) return null;

  // Get or create Stripe customer for the client
  const customer = await getOrCreateStripeCustomer({
    id: input.clientId,
    email: input.clientEmail,
    name: input.clientName,
  });

  if (!customer) return null;

  // Create the checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${getSiteUrl()}/portal/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getSiteUrl()}/portal/invoices`,
    metadata: {
      type: "individual_appointment",
      appointmentId: input.appointmentId,
      clientId: input.clientId,
      invoiceId: input.invoiceId || "",
    },
  });

  return {
    sessionId: session.id,
    customerId: customer.id,
  };
}

/**
 * Create a Stripe Checkout session for a Business10 / Business30 recurring
 * subscription. Returns null if Stripe or the plan's Price ID isn't
 * configured (the caller turns that into a clear error).
 */
export async function createBusinessSubscriptionCheckoutSession(input: {
  planKey: SubscriptionPlanKey;
  businessId: string;
  businessEmail: string;
  businessName: string;
  existingCustomerId?: string;
}): Promise<{ id: string; url: string | null; customerId: string } | null> {
  const stripe = getStripeClient();
  if (!stripe) return null;

  const priceId = getSubscriptionPriceId(input.planKey);
  if (!priceId) return null;
  const plan = SUBSCRIPTION_PLANS[input.planKey];

  const customer = input.existingCustomerId
    ? { id: input.existingCustomerId }
    : await getOrCreateStripeCustomerForBusiness({
        id: input.businessId,
        email: input.businessEmail,
        companyName: input.businessName,
      });
  if (!customer) return null;

  // One pending subscription checkout per business: expire any still-open
  // session for this customer/business so two tabs (or an admin link plus the
  // portal) can't both be paid and create two subscriptions.
  try {
    const open = await stripe.checkout.sessions.list({ customer: customer.id, status: "open", limit: 20 });
    await Promise.all(
      open.data
        .filter((cs) => cs.mode === "subscription" && cs.metadata?.businessId === input.businessId)
        .map((cs) => stripe.checkout.sessions.expire(cs.id).catch(() => undefined))
    );
  } catch (error) {
    console.warn("Could not expire open checkout sessions:", error instanceof Error ? error.message : error);
  }

  const metadata = { type: "subscription", businessId: input.businessId, planKey: input.planKey };
  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${getSiteUrl()}/portal/billing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getSiteUrl()}/portal/billing?cancelled=true`,
    subscription_data: { metadata },
    metadata,
    custom_text: {
      submit: {
        message: `${plan.name} includes ${plan.includedNotarizations} notarizations per billing month. Additional notarizations are billed at ${formatCents(plan.overagePerNotarizationCents, { showCents: false })} each.`,
      },
    },
  });

  return { id: session.id, url: session.url, customerId: customer.id };
}

/**
 * Switch an existing subscription between Business10 and Business30.
 * Swaps the subscription's single price item in place (Stripe prorates the
 * difference) and updates metadata. Our database is updated by the
 * resulting customer.subscription.updated webhook, which resolves the plan
 * from the Price ID — so the DB never disagrees with what Stripe bills.
 */
export async function changeBusinessSubscriptionPlan(input: {
  stripeSubscriptionId: string;
  newPlanKey: SubscriptionPlanKey;
  businessId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const stripe = getStripeClient();
  if (!stripe) return { ok: false, error: "Stripe is not configured" };
  const priceId = getSubscriptionPriceId(input.newPlanKey);
  if (!priceId) {
    return { ok: false, error: `${SUBSCRIPTION_PLANS[input.newPlanKey].stripePriceEnv} is not configured` };
  }

  const subscription = await stripe.subscriptions.retrieve(input.stripeSubscriptionId);
  if (subscription.metadata?.businessId && subscription.metadata.businessId !== input.businessId) {
    return { ok: false, error: "Subscription does not belong to this business" };
  }
  if (!["active", "trialing", "past_due"].includes(subscription.status)) {
    return { ok: false, error: `Subscription is ${subscription.status}; start a new plan instead` };
  }
  const item = subscription.items.data[0];
  if (!item) return { ok: false, error: "Subscription has no price item" };
  if (item.price.id === priceId) return { ok: false, error: "Already on this plan" };

  await stripe.subscriptions.update(subscription.id, {
    items: [{ id: item.id, price: priceId }],
    proration_behavior: "create_prorations",
    metadata: { ...subscription.metadata, type: "subscription", businessId: input.businessId, planKey: input.newPlanKey },
  });

  // Optimistically reflect the change; the webhook confirms it.
  await prisma.business.update({
    where: { id: input.businessId },
    data: { currentPlanKey: input.newPlanKey, packageKey: input.newPlanKey },
  });
  await recomputeCurrentPeriodUsage(input.businessId);
  return { ok: true };
}

/**
 * Get Stripe Customer Portal URL for subscription management
 */
export async function getStripePortalUrl(customerId: string): Promise<string | null> {
  const stripe = getStripeClient();
  if (!stripe) return null;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${getSiteUrl()}/portal/billing`,
  });

  return session.url;
}

/* ------------------------------------------------------------------------ */
/* Webhook handlers                                                          */
/* ------------------------------------------------------------------------ */

/**
 * Billing period of a subscription. Since Stripe API 2025-03-31 the period
 * lives on each subscription item rather than the subscription itself; read
 * the item first and fall back to the legacy top-level fields.
 */
function subscriptionPeriod(subscription: Stripe.Subscription): { start: Date | null; end: Date | null } {
  const item = subscription.items?.data?.[0] as (Stripe.SubscriptionItem & { current_period_start?: number; current_period_end?: number }) | undefined;
  const legacy = subscription as unknown as { current_period_start?: number; current_period_end?: number };
  const startSec = item?.current_period_start ?? legacy.current_period_start;
  const endSec = item?.current_period_end ?? legacy.current_period_end;
  return {
    start: typeof startSec === "number" ? new Date(startSec * 1000) : null,
    end: typeof endSec === "number" ? new Date(endSec * 1000) : null,
  };
}

/** Plan key for a subscription: Price ID first (authoritative), metadata second. */
function resolvePlanKey(subscription: Stripe.Subscription): string {
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const fromPrice = planKeyFromPriceId(priceId);
  if (fromPrice) return fromPrice;
  const meta = subscription.metadata?.planKey;
  return isSubscriptionPlanKey(meta) || meta === "unlimited" ? meta : "";
}

/**
 * Webhooks can arrive late, retried, or out of order. Re-read the live
 * subscription from Stripe when possible so we never apply a stale snapshot;
 * fall back to the event payload if Stripe can't be reached.
 */
async function freshSubscription(subscription: Stripe.Subscription): Promise<Stripe.Subscription> {
  const stripe = getStripeClient();
  if (!stripe) return subscription;
  try {
    return await stripe.subscriptions.retrieve(subscription.id);
  } catch {
    return subscription;
  }
}

const LIVE_STATUSES = ["active", "past_due", "incomplete"];

/**
 * Handle successful subscription creation from webhook
 */
export async function handleSubscriptionCreated(event: Stripe.Subscription) {
  const businessId = event.metadata?.businessId;
  const clientId = event.metadata?.clientId;
  if (!businessId && !clientId) return;

  const subscription = await freshSubscription(event);
  const status = mapStripeStatus(subscription.status);
  const planKey = resolvePlanKey(subscription);
  const { start, end } = subscriptionPeriod(subscription);

  if (businessId) {
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return;
    if (business.stripeSubscriptionId === subscription.id) {
      // Already linked (e.g. an update arrived first) — don't reset usage.
      return handleSubscriptionUpdated(subscription);
    }
    if (business.stripeSubscriptionId && LIVE_STATUSES.includes(business.subscriptionStatus)) {
      // A second live subscription for the same business: never silently
      // replace the first. Flag it so the owner can cancel/refund one.
      console.warn(`Duplicate subscription ${subscription.id} for business ${businessId} (existing ${business.stripeSubscriptionId})`);
      await prisma.notification.create({
        data: {
          type: "renewal",
          title: "Duplicate subscription detected",
          body: `${business.companyName} now has two Stripe subscriptions (${business.stripeSubscriptionId}, ${subscription.id}). Cancel one in Stripe.`,
          link: `/admin/businesses/${businessId}`,
        },
      });
      return;
    }
    await prisma.business.update({
      where: { id: businessId },
      data: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        currentPlanKey: planKey,
        packageKey: planKey,
        subscriptionStatus: status,
        nextBillingDate: end,
        monthlyUsageCount: 0,
        monthlyUsageResetDate: start,
        currentPeriodStart: start,
        currentPeriodEnd: end,
        status: "active",
      },
    });
  } else if (clientId) {
    await prisma.client.update({
      where: { id: clientId },
      data: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        currentPlanKey: planKey,
        subscriptionStatus: status,
        nextBillingDate: end,
        monthlyUsageCount: 0,
        monthlyUsageResetDate: start,
        currentPeriodStart: start,
        currentPeriodEnd: end,
        leadStatus: "active_client",
      },
    });
  }
}

/**
 * Handle subscription update from webhook — status, billing period, and
 * plan changes (Business10 ↔ Business30) made anywhere. Events for a
 * subscription that isn't the business's current one are ignored.
 */
export async function handleSubscriptionUpdated(event: Stripe.Subscription) {
  const businessId = event.metadata?.businessId;
  const clientId = event.metadata?.clientId;
  if (!businessId && !clientId) return;

  const subscription = await freshSubscription(event);
  const status = mapStripeStatus(subscription.status);
  const planKey = resolvePlanKey(subscription);
  const { start, end } = subscriptionPeriod(subscription);

  if (businessId) {
    const before = await prisma.business.findUnique({
      where: { id: businessId },
      select: { currentPeriodStart: true, stripeSubscriptionId: true },
    });
    if (!before) return;
    if (before.stripeSubscriptionId && before.stripeSubscriptionId !== subscription.id) {
      console.warn(`Ignoring update for non-current subscription ${subscription.id} on business ${businessId}`);
      return;
    }
    if (!before.stripeSubscriptionId && status === "canceled") return; // nothing to adopt
    const periodRolled = !!start && before.currentPeriodStart?.getTime() !== start.getTime();
    await prisma.business.update({
      where: { id: businessId },
      data: {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: status,
        ...(planKey ? { currentPlanKey: planKey, packageKey: planKey } : {}),
        ...(end ? { nextBillingDate: end, currentPeriodEnd: end } : {}),
        ...(start ? { currentPeriodStart: start } : {}),
        ...(periodRolled ? { monthlyUsageCount: 0, monthlyUsageResetDate: start } : {}),
      },
    });
    await recomputeCurrentPeriodUsage(businessId);
  } else if (clientId) {
    await prisma.client.update({
      where: { id: clientId },
      data: {
        subscriptionStatus: status,
        ...(planKey ? { currentPlanKey: planKey } : {}),
        ...(end ? { nextBillingDate: end, currentPeriodEnd: end } : {}),
        ...(start ? { currentPeriodStart: start } : {}),
      },
    });
  }
}

/**
 * Handle subscription deletion/cancellation from webhook. Usage rows,
 * invoices and events are kept — only the live subscription pointer clears,
 * and only if the deleted subscription IS the business's current one.
 */
export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const businessId = subscription.metadata?.businessId;
  const clientId = subscription.metadata?.clientId;
  if (!businessId && !clientId) return;

  if (businessId) {
    await prisma.business.updateMany({
      where: { id: businessId, stripeSubscriptionId: subscription.id },
      data: { subscriptionStatus: "canceled", currentPlanKey: "", stripeSubscriptionId: "" },
    });
  } else if (clientId) {
    await prisma.client.updateMany({
      where: { id: clientId, stripeSubscriptionId: subscription.id },
      data: { subscriptionStatus: "canceled", currentPlanKey: "", stripeSubscriptionId: "" },
    });
  }
}

/**
 * Map Stripe subscription status to our domain status
 */
function mapStripeStatus(status: string): string {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "unpaid":
    case "incomplete":
      return "incomplete";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return status;
  }
}

/* ------------------------------------------------------------------------ */
/* Usage metering (Business10 / Business30)                                  */
/* ------------------------------------------------------------------------ */

type Tx = Prisma.TransactionClient;

/**
 * Recalculate overage for one business billing period. Usage records are
 * processed oldest-first against a running total. Each record keeps the plan
 * and rate that were in force when it was recorded, so switching plans
 * mid-month never re-prices notarizations already used:
 *   - downgrade 30→10 with 25 used: past usage stays included; new usage is overage
 *   - upgrade 10→30 with 15 used: the 5 already-over stay billable; new usage
 *     counts against the 30 allowance
 * Records already invoiced are never modified (no double billing, no
 * silently rewriting a bill the customer has already received).
 */
async function recomputePeriod(tx: Tx, businessId: string, periodStart: Date, periodEnd: Date, fallbackPlanKey: SubscriptionPlanKey) {
  const rows = await tx.businessUsage.findMany({
    where: { businessId, billingPeriodStart: periodStart, billingPeriodEnd: periodEnd },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const planOf = (key: string) => SUBSCRIPTION_PLANS[isSubscriptionPlanKey(key) ? key : fallbackPlanKey];
  const allocation = allocateOverage(
    rows.map((r) => ({
      id: r.id,
      units: r.units,
      included: planOf(r.planKey).includedNotarizations,
      locked: r.billingStatus === "invoiced",
      lockedOverageUnits: r.overageUnits,
    })),
    SUBSCRIPTION_PLANS[fallbackPlanKey].includedNotarizations
  );
  for (const r of rows) {
    const units = allocation.get(r.id);
    if (units === undefined) continue;
    const rate = r.overageUnitCents > 0 ? r.overageUnitCents : planOf(r.planKey).overagePerNotarizationCents;
    const cents = units * rate;
    if (r.overageUnits !== units || r.overageAmountCents !== cents || r.overageUnitCents !== rate) {
      await tx.businessUsage.update({
        where: { id: r.id },
        data: { overageUnits: units, isOverage: units > 0, overageAmountCents: cents, overageUnitCents: rate },
      });
    }
  }
  return rows.reduce((sum, r) => sum + r.units, 0);
}

/** Recompute the business's current billing period and cache the count. */
export async function recomputeCurrentPeriodUsage(businessId: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business?.currentPeriodStart || !business.currentPeriodEnd || !isSubscriptionPlanKey(business.currentPlanKey)) return;
  const { currentPeriodStart, currentPeriodEnd, currentPlanKey } = business;
  const used = await runSerializable((tx) => recomputePeriod(tx, businessId, currentPeriodStart, currentPeriodEnd, currentPlanKey));
  await prisma.business.update({ where: { id: businessId }, data: { monthlyUsageCount: used } });
}

/** Retry Postgres serialization failures a few times before giving up. */
async function runSerializable<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(fn, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (attempt < 3 && (code === "P2034" || code === "40001")) continue;
      throw error;
    }
  }
}

export interface UsageSummary {
  planKey: SubscriptionPlanKey;
  used: number;
  included: number;
  remaining: number;
  overageUnits: number;
  overageCents: number;
  unbilledOverageCents: number;
  projectedTotalCents: number;
  periodStart: Date;
  periodEnd: Date;
}

/** Usage for a business's current billing period (null if no metered plan). */
export async function getBusinessUsageSummary(businessId: string): Promise<UsageSummary | null> {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business?.currentPeriodStart || !business.currentPeriodEnd || !isSubscriptionPlanKey(business.currentPlanKey)) return null;
  const plan = SUBSCRIPTION_PLANS[business.currentPlanKey];
  const rows = await prisma.businessUsage.findMany({
    where: { businessId, billingPeriodStart: business.currentPeriodStart, billingPeriodEnd: business.currentPeriodEnd },
    select: { units: true, overageUnits: true, overageAmountCents: true, billingStatus: true },
  });
  const used = rows.reduce((s, r) => s + r.units, 0);
  const overage = rows.reduce((s, r) => s + r.overageUnits, 0);
  const overageCents = rows.reduce((s, r) => s + r.overageAmountCents, 0);
  const unbilledOverageCents = rows.filter((r) => r.billingStatus === "unbilled").reduce((s, r) => s + r.overageAmountCents, 0);
  return {
    planKey: plan.key,
    used,
    included: plan.includedNotarizations,
    remaining: Math.max(0, plan.includedNotarizations - used),
    overageUnits: overage,
    overageCents,
    unbilledOverageCents,
    projectedTotalCents: plan.monthlyCents + overageCents,
    periodStart: business.currentPeriodStart,
    periodEnd: business.currentPeriodEnd,
  };
}

/**
 * Keep a business's usage in sync with one appointment. Call after any
 * change to an appointment (create, edit, status change, delete).
 *
 *  - completed + business on an active Business10/30 subscription → the
 *    appointment's notarial acts are recorded once (UNIQUE appointmentId)
 *  - anything else → an existing, not-yet-invoiced record is removed
 *
 * Then the affected period's overage is recomputed.
 */
export async function syncBusinessUsageForAppointment(appointmentId: string): Promise<void> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, status: true, businessId: true, numberOfActs: true, scheduledStart: true },
  });
  const existing = await prisma.businessUsage.findUnique({ where: { appointmentId } });

  const business = appointment?.businessId
    ? await prisma.business.findUnique({ where: { id: appointment.businessId } })
    : null;
  const planKey = business && isSubscriptionPlanKey(business.currentPlanKey) ? business.currentPlanKey : null;
  const metered =
    !!appointment &&
    appointment.status === "completed" &&
    !!business &&
    !!planKey &&
    ["active", "past_due"].includes(business.subscriptionStatus) &&
    !!business.currentPeriodStart &&
    !!business.currentPeriodEnd;

  const affected: { businessId: string; start: Date; end: Date; planKey: SubscriptionPlanKey }[] = [];

  if (!metered) {
    if (existing && existing.billingStatus !== "invoiced") {
      await prisma.businessUsage.delete({ where: { id: existing.id } });
      if (isSubscriptionPlanKey(existing.planKey)) {
        affected.push({ businessId: existing.businessId, start: existing.billingPeriodStart, end: existing.billingPeriodEnd, planKey: existing.planKey });
      }
    }
  } else {
    const units = Math.max(1, appointment!.numberOfActs || 1);
    let start = business!.currentPeriodStart!;
    let end = business!.currentPeriodEnd!;
    // A completion logged late for an appointment from the previous billing
    // month is attributed to that month if we have it on record.
    if (appointment!.scheduledStart < start) {
      const prior = await prisma.businessUsage.findFirst({
        where: { businessId: business!.id, billingPeriodStart: { lte: appointment!.scheduledStart }, billingPeriodEnd: { gt: appointment!.scheduledStart } },
        select: { billingPeriodStart: true, billingPeriodEnd: true },
      });
      if (prior) {
        start = prior.billingPeriodStart;
        end = prior.billingPeriodEnd;
      }
    }

    if (!existing) {
      try {
        await prisma.businessUsage.create({
          data: {
            businessId: business!.id,
            appointmentId,
            stripeSubscriptionId: business!.stripeSubscriptionId,
            billingPeriodStart: start,
            billingPeriodEnd: end,
            units,
            planKey: planKey!,
            overageUnitCents: SUBSCRIPTION_PLANS[planKey!].overagePerNotarizationCents,
          },
        });
      } catch (error) {
        if ((error as { code?: string })?.code !== "P2002") throw error; // already counted (concurrent request)
      }
    } else if (existing.billingStatus !== "invoiced" && existing.units !== units) {
      await prisma.businessUsage.update({ where: { id: existing.id }, data: { units } });
    }
    affected.push({ businessId: business!.id, start, end, planKey: planKey! });
  }

  for (const a of affected) {
    await runSerializable((tx) => recomputePeriod(tx, a.businessId, a.start, a.end, a.planKey));
    await recomputeCurrentPeriodUsage(a.businessId);
  }
}

/* ------------------------------------------------------------------------ */
/* Overage invoicing                                                         */
/* ------------------------------------------------------------------------ */

/**
 * Create one invoice for ALL of a business's not-yet-invoiced overage
 * (current and past billing months). Line items keep the Michigan statutory
 * notarial fee ($10/act) separate from the other lawful service charge.
 * Invoice creation and marking the usage rows as invoiced happen in one
 * Serializable transaction, so the same overage can never be billed twice.
 */
export async function createOverageInvoice(input: { businessId: string }): Promise<string | null> {
  const business = await prisma.business.findUnique({ where: { id: input.businessId } });
  if (!business) return null;

  return runSerializable(async (tx) => {
    const rows = await tx.businessUsage.findMany({
      where: { businessId: input.businessId, billingStatus: "unbilled", invoiceId: null, overageUnits: { gt: 0 } },
      orderBy: { createdAt: "asc" },
    });
    if (rows.length === 0) return null;

    // Group by unit price so a rate change never mixes amounts on one line.
    const byRate = new Map<number, number>();
    for (const r of rows) byRate.set(r.overageUnitCents, (byRate.get(r.overageUnitCents) ?? 0) + r.overageUnits);

    const items: Prisma.InvoiceItemCreateWithoutInvoiceInput[] = [];
    for (const [rate, units] of byRate) {
      const statutory = Math.min(STATUTORY_FEE_PER_ACT_CENTS, rate);
      items.push({
        description: `Statutory notarial fee — additional notarizations (MCL 55.285, $${(statutory / 100).toFixed(2)}/act)`,
        type: "statutory_fee",
        quantity: units,
        unitAmountCents: statutory,
        amountCents: statutory * units,
      });
      if (rate > statutory) {
        items.push({
          description: "Mobile/remote service, scheduling & administrative services — additional notarizations",
          type: "other_service",
          quantity: units,
          unitAmountCents: rate - statutory,
          amountCents: (rate - statutory) * units,
        });
      }
    }
    const totalUnits = rows.reduce((s, r) => s + r.overageUnits, 0);

    let seq = (await tx.invoice.count()) + 1;
    let invoiceNumber = generateInvoiceNumber(seq);
    while (await tx.invoice.findUnique({ where: { invoiceNumber }, select: { id: true } })) {
      invoiceNumber = generateInvoiceNumber(++seq);
    }
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);

    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        businessId: input.businessId,
        clientName: business.billingContactName || business.contactName || business.companyName,
        company: business.companyName,
        email: business.billingContactEmail || business.email,
        issueDate: new Date(),
        dueDate,
        status: "draft",
        notes: `${planDisplayName(rows[rows.length - 1].planKey)} — ${totalUnits} additional notarization${totalUnits === 1 ? "" : "s"} beyond the plan's included amount.`,
        items: { create: items },
      },
    });

    const now = new Date();
    await tx.businessUsage.updateMany({
      where: { id: { in: rows.map((r) => r.id) }, billingStatus: "unbilled", invoiceId: null },
      data: { billingStatus: "invoiced", invoiceId: invoice.id, invoicedAt: now },
    });
    return invoice.id;
  });
}
