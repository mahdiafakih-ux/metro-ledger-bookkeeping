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

/**
 * Get all configured Stripe Price IDs
 */
export function getStripePriceIds() {
  return {
    individual: process.env.STRIPE_PRICE_INDIVIDUAL || "",
    business30: process.env.STRIPE_PRICE_BUSINESS30 || "",
    unlimited: process.env.STRIPE_PRICE_BUSINESS_UNLIMITED || "",
  };
}

/**
 * Validate that all required Stripe Price IDs are configured
 */
export function areStripePricesConfigured() {
  const prices = getStripePriceIds();
  return prices.individual && prices.business30 && prices.unlimited;
}
