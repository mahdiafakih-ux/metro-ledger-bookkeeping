import Stripe from "stripe";
import {
  LEGACY_PLANS,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_PLAN_LIST,
  type LegacyPlanKey,
  type SubscriptionPlanKey,
} from "@/lib/plans";

let stripeClient: Stripe | null = null;
let attempted = false;

/**
 * Returns a Stripe client, or null if STRIPE_SECRET_KEY isn't configured.
 * Payments are entirely optional for local development — every call site
 * must handle a null client by falling back to "pay later" / manual
 * payment recording rather than throwing.
 */
export function getStripeClient(): Stripe | null {
  if (attempted) return stripeClient;
  attempted = true;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  stripeClient = new Stripe(key, { apiVersion: "2026-08-26.dahlia" });
  return stripeClient;
}

export function isStripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY;
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

/**
 * Stripe Price IDs, read from env vars named in the plan catalog.
 * Never invent or hard-code a Price ID — an empty string means "not
 * configured", and checkout for that plan is refused with a clear error.
 */
export function getSubscriptionPriceId(planKey: SubscriptionPlanKey): string {
  return (process.env[SUBSCRIPTION_PLANS[planKey].stripePriceEnv] || "").trim();
}

export function getStripePriceIds() {
  return {
    individual: (process.env.STRIPE_PRICE_INDIVIDUAL || "").trim(),
    business10: getSubscriptionPriceId("business10"),
    business30: getSubscriptionPriceId("business30"),
  };
}

/** Which env-configured prices are still missing (for admin warnings). */
export function missingStripePriceEnvVars(): string[] {
  const missing: string[] = [];
  if (!process.env.STRIPE_PRICE_INDIVIDUAL) missing.push("STRIPE_PRICE_INDIVIDUAL");
  for (const plan of SUBSCRIPTION_PLAN_LIST) {
    if (!process.env[plan.stripePriceEnv]) missing.push(plan.stripePriceEnv);
  }
  return missing;
}

export function areStripePricesConfigured() {
  return missingStripePriceEnvVars().length === 0;
}

/**
 * Map a Stripe Price ID back to our plan key. Used by webhooks so a plan
 * change made anywhere (our portal, the Stripe Billing Portal, or the Stripe
 * Dashboard) always updates `currentPlanKey` correctly. Recognises the
 * discontinued Unlimited price only so legacy subscribers keep displaying.
 */
export function planKeyFromPriceId(priceId: string | null | undefined): SubscriptionPlanKey | LegacyPlanKey | null {
  if (!priceId) return null;
  for (const plan of SUBSCRIPTION_PLAN_LIST) {
    if (getSubscriptionPriceId(plan.key) === priceId) return plan.key;
  }
  const legacy = (process.env[LEGACY_PLANS.unlimited.stripePriceEnv] || "").trim();
  if (legacy && legacy === priceId) return "unlimited";
  return null;
}
