/**
 * Notar-E plan catalog — the ONE authoritative source for plan keys,
 * included notarizations, subscription prices and overage rates.
 *
 * Everything that bills, meters usage, or displays business-plan numbers
 * (Stripe checkout, webhooks, usage/overage, client portal, admin, public
 * pricing cards, calculators) reads from here. The admin-editable
 * `PricingPlan` rows in the database only carry marketing copy (name,
 * description, feature bullets, "most popular" flag) for subscription
 * plans; their numbers are overwritten from this catalog on display so the
 * website can never advertise a price Stripe doesn't charge.
 *
 * This module is safe to import from client components: it contains no
 * secrets. Stripe Price IDs are resolved server-side in `lib/stripe.ts`
 * from the env var names listed here.
 *
 * Michigan compliance: MCL 55.285 limits the fee for the notarial act
 * itself to $10 per act. Every amount here is a *package* price made of
 * the statutory notarial fee plus separately-disclosed, lawful non-notarial
 * services (mobile travel, remote-session technology/handling, scheduling,
 * signing-agent and administrative services). `feeBreakdown()` produces
 * that split for display.
 */

export const STATUTORY_FEE_PER_ACT_CENTS = 1000; // $10 — Michigan maximum per notarial act

export type SubscriptionPlanKey = "business10" | "business30";
export type LegacyPlanKey = "unlimited";
export type PlanKey = "individual" | SubscriptionPlanKey | LegacyPlanKey;

export interface SubscriptionPlan {
  key: SubscriptionPlanKey;
  name: string;
  shortName: string;
  monthlyCents: number;
  includedNotarizations: number;
  overagePerNotarizationCents: number;
  /** Env var that must hold this plan's recurring monthly Stripe Price ID. */
  stripePriceEnv: string;
  status: "active";
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanKey, SubscriptionPlan> = {
  business10: {
    key: "business10",
    name: "Business10",
    shortName: "B10",
    monthlyCents: 100_000,
    includedNotarizations: 10,
    overagePerNotarizationCents: 7_500,
    stripePriceEnv: "STRIPE_PRICE_BUSINESS10",
    status: "active",
  },
  business30: {
    key: "business30",
    name: "Business30",
    shortName: "B30",
    monthlyCents: 300_000,
    includedNotarizations: 30,
    overagePerNotarizationCents: 7_500,
    stripePriceEnv: "STRIPE_PRICE_BUSINESS30",
    status: "active",
  },
};

/** Ordered for display (smallest first). */
export const SUBSCRIPTION_PLAN_LIST: SubscriptionPlan[] = [SUBSCRIPTION_PLANS.business10, SUBSCRIPTION_PLANS.business30];

/**
 * Discontinued plans. Kept ONLY so historical subscriptions, invoices,
 * usage rows and revenue records still render with a sensible name. Never
 * offered for purchase, never selectable, never shown publicly.
 */
export const LEGACY_PLANS: Record<LegacyPlanKey, { key: LegacyPlanKey; name: string; stripePriceEnv: string; status: "discontinued" }> = {
  unlimited: {
    key: "unlimited",
    name: "Business Unlimited (discontinued)",
    // Optional: only used to recognise a legacy subscription in webhooks.
    stripePriceEnv: "STRIPE_PRICE_BUSINESS_UNLIMITED",
    status: "discontinued",
  },
};

export const INDIVIDUAL_PLAN_KEY = "individual" as const;

export function isSubscriptionPlanKey(key: unknown): key is SubscriptionPlanKey {
  return key === "business10" || key === "business30";
}

export function isLegacyPlanKey(key: unknown): key is LegacyPlanKey {
  return key === "unlimited";
}

export function getSubscriptionPlan(key: string | null | undefined): SubscriptionPlan | null {
  return isSubscriptionPlanKey(key) ? SUBSCRIPTION_PLANS[key] : null;
}

/** Human-readable name for any plan key, including discontinued/unknown ones. */
export function planDisplayName(key: string | null | undefined): string {
  if (!key) return "No plan";
  if (isSubscriptionPlanKey(key)) return SUBSCRIPTION_PLANS[key].name;
  if (isLegacyPlanKey(key)) return LEGACY_PLANS[key].name;
  if (key === INDIVIDUAL_PLAN_KEY) return "Individual Service";
  return key.replace(/_/g, " ");
}

/**
 * Monthly cost for a given number of notarizations on a plan.
 *   Business10: 10 → $1,000 · 11 → $1,075 · 15 → $1,375 · 20 → $1,750
 *   Business30: 30 → $3,000 · 31 → $3,075 · 35 → $3,375 · 40 → $3,750
 */
export function monthlyCostCents(plan: SubscriptionPlan, notarizations: number): number {
  const n = Math.max(0, Math.floor(notarizations));
  return plan.monthlyCents + overageUnits(plan.includedNotarizations, n) * plan.overagePerNotarizationCents;
}

export function overageUnits(included: number, used: number): number {
  return Math.max(0, Math.floor(used) - included);
}

/** Cheapest active plan for a monthly volume (ties go to the smaller plan). */
export function cheapestPlanFor(notarizations: number): SubscriptionPlan {
  return SUBSCRIPTION_PLAN_LIST.reduce((best, p) =>
    monthlyCostCents(p, notarizations) < monthlyCostCents(best, notarizations) ? p : best
  );
}

/**
 * Smallest monthly volume at which Business30 costs less than Business10,
 * or Infinity if it never does. Computed, not hard-coded, so marketing copy
 * stays truthful if prices change.
 *
 * NOTE: with $75 overage on both plans, Business10 is cheaper at EVERY
 * volume (at 30: $2,500 vs $3,000; above 30 it stays $500 cheaper), so this
 * currently returns Infinity and no page may claim Business30 saves money.
 */
export function business30BreakEven(): number {
  for (let n = 0; n <= 500; n++) {
    if (monthlyCostCents(SUBSCRIPTION_PLANS.business30, n) < monthlyCostCents(SUBSCRIPTION_PLANS.business10, n)) return n;
  }
  return Infinity;
}

/**
 * Michigan-compliant split of a subscription's base price: statutory
 * notarial fees for the included notarizations vs. other lawful services.
 */
export function feeBreakdown(plan: SubscriptionPlan) {
  const statutoryCents = plan.includedNotarizations * STATUTORY_FEE_PER_ACT_CENTS;
  return {
    statutoryCents,
    serviceCents: plan.monthlyCents - statutoryCents,
    overageStatutoryCents: STATUTORY_FEE_PER_ACT_CENTS,
    overageServiceCents: plan.overagePerNotarizationCents - STATUTORY_FEE_PER_ACT_CENTS,
  };
}

/**
 * Allocate overage across usage records in chronological order.
 * Records whose overage is already invoiced are "locked": their units still
 * count toward the running total, but their overage is never changed.
 * Returns the new overageUnits for every unlocked record.
 */
export function allocateOverage(
  records: { id: string; units: number; locked: boolean; lockedOverageUnits: number; included?: number }[],
  included: number
): Map<string, number> {
  const out = new Map<string, number>();
  let cumulative = 0;
  for (const r of records) {
    // Each record may carry the allowance of the plan it was recorded under.
    const allowance = r.included ?? included;
    const before = cumulative;
    cumulative += Math.max(0, r.units);
    const units = Math.max(0, overageUnits(allowance, cumulative) - overageUnits(allowance, before));
    if (!r.locked) out.set(r.id, units);
  }
  return out;
}
