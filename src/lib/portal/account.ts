import { cache } from "react";
import { redirect } from "next/navigation";
import type { Prisma, PricingPlan } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getClientSession } from "@/lib/client-auth";
import { getBusinessSettings } from "@/lib/settings";
import { detroitMonthRange } from "@/lib/tz";

/**
 * Everything the client portal needs to know about "who is signed in and what
 * account are they looking at", resolved once per request from real records.
 *
 * Business subscriptions are written by the Stripe webhook onto the
 * **Business** row, and clients are linked to businesses through the
 * BusinessClient table (with a role). This loader is the single place that
 * resolves that relationship for the portal.
 */

export type PlanKind = "business30" | "unlimited" | "payg" | "other";

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

const BUSINESS_PLAN_KEYS = new Set(["business30", "unlimited"]);

function planKindFor(key: string): PlanKind {
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

  const settings = await getBusinessSettings();
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

  const included =
    kind === "business30" ? pricing?.appointmentsIncluded ?? settings.business30IncludedAppointments : null;

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
        : pricing.totalCents
      : null,
    billingPeriod: pricing ? (pricing.billingPeriod === "monthly" ? "monthly" : "one_time") : null,
    statutoryFeeCents: pricing?.statutoryFeeCents ?? null,
    serviceFeeCents: pricing?.serviceFeeCents ?? null,
    serviceFeeLabel: pricing?.serviceFeeLabel ?? "",
    nextBillingDate: src.nextBillingDate,
    periodStart,
    periodEnd,
    periodSource: hasStripePeriod ? "stripe" : "calendar_month",
    included,
    overageFeeCents: kind === "business30" ? pricing?.overageFeeCents ?? null : null,
    owner,
    hasStripeCustomer: !!src.stripeCustomerId,
  };

  let usage: PortalUsage | null = null;
  if (kind === "business30" || kind === "unlimited") {
    // Usage = completed appointments on this account within the billing period.
    const used = await prisma.appointment.count({
      where: {
        ...(owner === "business" && business ? { businessId: business.id } : { clientId: client.id }),
        status: "completed",
        scheduledStart: { gte: periodStart, lt: periodEnd },
      },
    });
    const overage = included != null ? Math.max(0, used - included) : 0;
    usage = {
      used,
      included,
      remaining: included != null ? Math.max(0, included - used) : null,
      overage,
      estimatedOverageCents: plan.overageFeeCents != null ? overage * plan.overageFeeCents : null,
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
