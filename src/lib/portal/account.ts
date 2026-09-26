import { cache } from "react";
import { redirect } from "next/navigation";
import type { Prisma, PricingPlan } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getClientSession } from "@/lib/client-auth";
import { detroitMonthRange } from "@/lib/tz";
import { SUBSCRIPTION_PLANS } from "@/lib/plans";

/**
 * Everything the client portal needs to know about "who is signed in and what
 * account are they looking at", resolved once per request from real records.
 *
 * Business subscriptions are written by the Stripe webhook onto the
 * **Business** row, and clients are linked to businesses through the
 * BusinessClient table (with a role). This loader is the single place that
 * resolves that relationship for the portal.
 */

// "unlimited" = discontinued Business Unlimited; kept only so a legacy
// subscriber's portal still renders. It is never offered or purchasable.
export type PlanKind = "business10" | "business30" | "unlimited" | "payg" | "other";

/** Plans billed as a monthly subscription (incl. the legacy Unlimited). */
export function isSubscriptionKind(kind: PlanKind): kind is "business10" | "business30" | "unlimited" {
  return kind === "business10" || kind === "business30" || kind === "unlimited";
}

/** Plans with a monthly allowance + per-notarization overage. */
export function isMeteredKind(kind: PlanKind): kind is "business10" | "business30" {
  return kind === "business10" || kind === "business30";
}

export interface PortalPlan {
  kind: PlanKind;
  key: string;
  name: string;
  status: string; // "" | active | past_due | canceled | incomplete
  priceCents: number | null;
  billingPeriod: "monthly" | "one_time" | null;
  statutoryFeeCents: number | null; // per act, from PricingPlan
  serviceFeeCents: number | null;
  serviceFeeLabel: string;
  nextBillingDate: Date | null;
  periodStart: Date;
  periodEnd: Date;
  periodSource: "stripe" | "calendar_month";
  included: number | null; // null = unlimited / not applicable
  overageFeeCents: number | null;
  owner: "business" | "client";
  hasStripeCustomer: boolean;
}

export interface PortalUsage {
  used: number;
  included: number | null;
  remaining: number | null;
  overage: number;
  estimatedOverageCents: number | null;
  percent: number | null;
}

export interface PortalAccount {
  client: {
    id: string;
    name: string;
    firstName: string;
    email: string;
    phone: string;
    company: string;
    createdAt: Date;
  };
  business: {
    id: string;
    companyName: string;
    role: string; // owner | admin | member | viewer
  } | null;
  /** Owner/admin of a business can see the whole business's appointments & billing. */
  canViewBusiness: boolean;
  /** Owner/admin can manage the business subscription in Stripe. */
  canManageBilling: boolean;
  /** Everyone except "viewer" may request notaries / manage preferences. */
  canRequest: boolean;
  displayName: string;
  plan: PortalPlan;
  usage: PortalUsage | null;
}

const BUSINESS_PLAN_KEYS = new Set(["business10", "business30", "unlimited"]);

function planKindFor(key: string): PlanKind {
  if (key === "business10") return "business10";
  if (key === "business30") return "business30";
  if (key === "unlimited") return "unlimited";
  if (key === "" || key === "individual") return "payg";
  return "other";
}

function isLiveStatus(status: string) {
  // Treat an empty status as active for admin-assigned plans without Stripe.
  return status === "" || status === "active" || status === "past_due" || status === "trialing";
}

/** Resolve the signed-in account, or redirect to login. Cached per request. */
export const getPortalAccount = cache(async (): Promise<PortalAccount> => {
  const session = await getClientSession();
  if (!session) redirect("/portal/login");

  const client = await prisma.client.findUnique({
    where: { id: session.clientId },
    include: {
      businessClients: {
        include: { business: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!client) redirect("/portal/login");

  // Prefer a membership whose business has a live plan; else the first.
  const memberships = client.businessClients;
  const membership =
    memberships.find((m) => {
      const key = m.business.currentPlanKey || m.business.packageKey;
      return BUSINESS_PLAN_KEYS.has(key) && isLiveStatus(m.business.subscriptionStatus);
    }) ?? memberships[0] ?? null;
  const business = membership?.business ?? null;
  const role = membership?.role ?? "";

  const plans = await prisma.pricingPlan.findMany();
  const planByKey = new Map<string, PricingPlan>(plans.map((p) => [p.key, p]));

  // Which record carries the subscription?
  const businessKey = business ? business.currentPlanKey || business.packageKey : "";
  const businessPlanLive = business && businessKey && business.subscriptionStatus !== "canceled";
  const owner: "business" | "client" = businessPlanLive ? "business" : "client";
  const src = owner === "business" && business ? business : client;
  const key = owner === "business" ? businessKey : client.currentPlanKey;

  const kind = planKindFor(key);
  const pricing = planByKey.get(kind === "payg" ? "individual" : key) ?? null;

  // Billing period: Stripe's period when we have it, else the Detroit calendar month.
  const hasStripePeriod = !!(src.currentPeriodStart && src.currentPeriodEnd);
  const month = detroitMonthRange();
  const periodStart = hasStripePeriod ? src.currentPeriodStart! : month.start;
  const periodEnd = hasStripePeriod ? src.currentPeriodEnd! : month.end;

  // Business10/Business30 numbers come from the plan catalog (the same source
  // Stripe billing and the usage ledger use), never from editable DB rows.
  const catalog = isMeteredKind(kind) ? SUBSCRIPTION_PLANS[kind] : null;
  const included = catalog ? catalog.includedNotarizations : null;

  const plan: PortalPlan = {
    kind,
    key,
    name:
      pricing?.name ??
      (kind === "payg" ? "Pay As You Go" : key ? key.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Pay As You Go"),
    status: src.subscriptionStatus,
    // Pay-as-you-go shows what booking actually charges for one act
    // (statutory fee + service fee), not a separately-stored total.
    priceCents: pricing
      ? kind === "payg"
        ? pricing.statutoryFeeCents + pricing.serviceFeeCents
        : catalog?.monthlyCents ?? pricing.totalCents
      : catalog?.monthlyCents ?? null,
    billingPeriod: catalog ? "monthly" : pricing ? (pricing.billingPeriod === "monthly" ? "monthly" : "one_time") : null,
    statutoryFeeCents: pricing?.statutoryFeeCents ?? null,
    serviceFeeCents: pricing?.serviceFeeCents ?? null,
    serviceFeeLabel: pricing?.serviceFeeLabel ?? "",
    nextBillingDate: src.nextBillingDate,
    periodStart,
    periodEnd,
    periodSource: hasStripePeriod ? "stripe" : "calendar_month",
    included,
    overageFeeCents: catalog ? catalog.overagePerNotarizationCents : null,
    owner,
    hasStripeCustomer: !!src.stripeCustomerId,
  };

  let usage: PortalUsage | null = null;
  if (isSubscriptionKind(kind)) {
    // Usage = notarizations (notarial acts) on completed appointments on this
    // account within the billing period.
    const agg = await prisma.appointment.aggregate({
      where: {
        ...(owner === "business" && business ? { businessId: business.id } : { clientId: client.id }),
        status: "completed",
        scheduledStart: { gte: periodStart, lt: periodEnd },
      },
      _sum: { numberOfActs: true },
      _count: { _all: true },
    });
    const used = Math.max(agg._sum.numberOfActs ?? 0, agg._count._all);
    let overage = included != null ? Math.max(0, used - included) : 0;
    let estimatedOverageCents: number | null = plan.overageFeeCents != null ? overage * plan.overageFeeCents : null;
    // When the business has a Stripe period, the usage ledger is authoritative
    // (it keeps each notarization's original plan terms across plan switches).
    if (owner === "business" && business && hasStripePeriod && isMeteredKind(kind)) {
      const ledger = await prisma.businessUsage.aggregate({
        where: { businessId: business.id, billingPeriodStart: periodStart, billingPeriodEnd: periodEnd },
        _sum: { overageUnits: true, overageAmountCents: true },
        _count: { _all: true },
      });
      if (ledger._count._all > 0) {
        overage = ledger._sum.overageUnits ?? 0;
        estimatedOverageCents = ledger._sum.overageAmountCents ?? 0;
      }
    }
    usage = {
      used,
      included,
      remaining: included != null ? Math.max(0, included - used) : null,
      overage,
      estimatedOverageCents,
      percent: included ? Math.min(100, Math.round((used / included) * 100)) : null,
    };
  }

  const canViewBusiness = !!business && (role === "owner" || role === "admin");
  const firstName = client.name.trim().split(/\s+/)[0] || client.name;

  return {
    client: {
      id: client.id,
      name: client.name,
      firstName,
      email: client.email,
      phone: client.phone,
      company: client.company,
      createdAt: client.createdAt,
    },
    business: business ? { id: business.id, companyName: business.companyName, role } : null,
    canViewBusiness,
    canManageBilling: owner === "business" ? canViewBusiness : true,
    canRequest: role !== "viewer",
    displayName: business?.companyName || client.company || client.name,
    plan,
    usage,
  };
});

// ---------- Authorization scopes (server-side, never from the browser) ----------

export function appointmentScope(account: PortalAccount): Prisma.AppointmentWhereInput {
  return account.canViewBusiness && account.business
    ? { OR: [{ clientId: account.client.id }, { businessId: account.business.id }] }
    : { clientId: account.client.id };
}

/** Invoices clients may see. Drafts are internal and never shown. */
export function invoiceScope(account: PortalAccount): Prisma.InvoiceWhereInput {
  const owner: Prisma.InvoiceWhereInput =
    account.canViewBusiness && account.business
      ? { OR: [{ clientId: account.client.id }, { businessId: account.business.id }] }
      : { clientId: account.client.id };
  return { AND: [owner, { status: { not: "draft" } }] };
}

export function paymentScope(account: PortalAccount): Prisma.PaymentWhereInput {
  return {
    OR: [
      { appointment: appointmentScope(account) },
      { invoice: invoiceScope(account) },
    ],
  };
}

/** Where preferred notaries live for this account (shared team list for businesses). */
export function preferenceOwner(account: PortalAccount): { businessId: string } | { clientId: string } {
  return account.business ? { businessId: account.business.id } : { clientId: account.client.id };
}

export const MAX_PREFERRED_NOTARIES = 3;
