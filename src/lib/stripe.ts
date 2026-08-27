import Stripe from "stripe";

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
