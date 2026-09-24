import Stripe from "stripe";
import { getStripeClient, getSiteUrl } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { getBusinessSettings } from "@/lib/settings";
import { syncBusinessUsageSafe } from "@/lib/usage";

/**
 * Create or get a Stripe customer for a client
 */
export async function getOrCreateStripeCustomer(
  client: { id: string; email: string; name: string }
) {
  const stripe = getStripeClient();
  if (!stripe) return null;

  // Check if customer already exists
  if (client.email) {
    const existing = await stripe.customers.list({ email: client.email, limit: 1 });
    if (existing.data.length > 0) {
      return existing.data[0];
    }
  }

  // Create new customer
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

  // Check if customer already exists
  if (business.email) {
    const existing = await stripe.customers.list({ email: business.email, limit: 1 });
    if (existing.data.length > 0) {
      return existing.data[0];
    }
  }

  // Create new customer
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
 * Create a Stripe Checkout session for Business30 recurring subscription
 */
export async function createBusiness30CheckoutSession(input: {
  businessId: string;
  businessEmail: string;
  businessName: string;
}): Promise<string | null> {
  const stripe = getStripeClient();
  if (!stripe) return null;

  const priceId = process.env.STRIPE_PRICE_BUSINESS30;
  if (!priceId) return null;

  // Get or create Stripe customer
  const customer = await getOrCreateStripeCustomerForBusiness({
    id: input.businessId,
    email: input.businessEmail,
    companyName: input.businessName,
  });

  if (!customer) return null;

  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${getSiteUrl()}/portal/billing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getSiteUrl()}/portal/billing?cancelled=true`,
    subscription_data: {
      metadata: {
        type: "subscription",
        businessId: input.businessId,
        planKey: "business30",
      },
    },
    metadata: {
      type: "subscription",
      businessId: input.businessId,
      planKey: "business30",
    },
  });

  return session.id;
}

/**
 * Create a Stripe Checkout session for Business Unlimited recurring subscription
 */
export async function createUnlimitedCheckoutSession(input: {
  businessId: string;
  businessEmail: string;
  businessName: string;
}): Promise<string | null> {
  const stripe = getStripeClient();
  if (!stripe) return null;

  const priceId = process.env.STRIPE_PRICE_BUSINESS_UNLIMITED;
  if (!priceId) return null;

  // Get or create Stripe customer
  const customer = await getOrCreateStripeCustomerForBusiness({
    id: input.businessId,
    email: input.businessEmail,
    companyName: input.businessName,
  });

  if (!customer) return null;

  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${getSiteUrl()}/portal/billing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getSiteUrl()}/portal/billing?cancelled=true`,
    subscription_data: {
      metadata: {
        type: "subscription",
        businessId: input.businessId,
        planKey: "unlimited",
      },
    },
    metadata: {
      type: "subscription",
      businessId: input.businessId,
      planKey: "unlimited",
    },
  });

  return session.id;
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

/**
 * Handle successful subscription creation from webhook
 */
export async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const businessId = subscription.metadata?.businessId;
  const clientId = subscription.metadata?.clientId;
  const planKey = subscription.metadata?.planKey;

  if (!businessId && !clientId) return;

  const status = mapStripeStatus(subscription.status);
  const nextBillingDate = new Date(((subscription as any).current_period_end as any) * 1000);

  // SECURITY: Store actual Stripe billing period for accurate overage calculation
  const currentPeriodStart = new Date(((subscription as any).current_period_start as any) * 1000);
  const currentPeriodEnd = new Date(((subscription as any).current_period_end as any) * 1000);

  if (businessId) {
    await prisma.business.update({
      where: { id: businessId },
      data: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        currentPlanKey: planKey || "",
        subscriptionStatus: status,
        nextBillingDate,
        monthlyUsageCount: 0,
        monthlyUsageResetDate: currentPeriodStart,
        // SECURITY: Store actual Stripe billing period
        currentPeriodStart,
        currentPeriodEnd,
        status: "active",
      },
    });
    // Counting only — recount usage for the new billing period. Never bills.
    await syncBusinessUsageSafe(businessId);
  } else if (clientId) {
    await prisma.client.update({
      where: { id: clientId },
      data: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        currentPlanKey: planKey || "",
        subscriptionStatus: status,
        nextBillingDate,
        monthlyUsageCount: 0,
        monthlyUsageResetDate: currentPeriodStart,
        // SECURITY: Store actual Stripe billing period
        currentPeriodStart,
        currentPeriodEnd,
        leadStatus: "active_client",
      },
    });
  }
}

/**
 * Handle subscription update from webhook
 */
export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const businessId = subscription.metadata?.businessId;
  const clientId = subscription.metadata?.clientId;

  if (!businessId && !clientId) return;

  const status = mapStripeStatus(subscription.status);
  const nextBillingDate = new Date(((subscription as any).current_period_end as any) * 1000);

  // SECURITY: Update Stripe billing period
  const currentPeriodStart = new Date(((subscription as any).current_period_start as any) * 1000);
  const currentPeriodEnd = new Date(((subscription as any).current_period_end as any) * 1000);

  if (businessId) {
    await prisma.business.update({
      where: { id: businessId },
      data: {
        subscriptionStatus: status,
        nextBillingDate,
        currentPeriodStart,
        currentPeriodEnd,
      },
    });
    // Period may have rolled over (renewal) — recount. Counting only, never bills.
    await syncBusinessUsageSafe(businessId);
  } else if (clientId) {
    await prisma.client.update({
      where: { id: clientId },
      data: {
        subscriptionStatus: status,
        nextBillingDate,
        currentPeriodStart,
        currentPeriodEnd,
      },
    });
  }
}

/**
 * Handle subscription deletion/cancellation from webhook
 */
export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const businessId = subscription.metadata?.businessId;
  const clientId = subscription.metadata?.clientId;

  if (!businessId && !clientId) return;

  if (businessId) {
    await prisma.business.update({
      where: { id: businessId },
      data: {
        subscriptionStatus: "canceled",
        currentPlanKey: "",
        stripeSubscriptionId: "",
      },
    });
  } else if (clientId) {
    await prisma.client.update({
      where: { id: clientId },
      data: {
        subscriptionStatus: "canceled",
        currentPlanKey: "",
        stripeSubscriptionId: "",
      },
    });
  }
}

/**
 * Map Stripe subscription status to our domain status
 */
function mapStripeStatus(status: string): string {
  switch (status) {
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "incomplete";
    case "canceled":
      return "canceled";
    case "incomplete":
      return "incomplete";
    case "incomplete_expired":
      return "canceled";
    default:
      return status;
  }
}

/**
 * Increment monthly usage count for a business client
 * Returns true if usage is within limits for business30, false if overage
 */
export async function incrementMonthlyUsage(
  businessId: string,
  appointmentId: string
): Promise<{ withinLimit: boolean; usageCount: number; includedAppointments: number; overageCount: number }> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });

  if (!business || business.currentPlanKey !== "business30") {
    return { withinLimit: true, usageCount: 0, includedAppointments: 0, overageCount: 0 };
  }

  // SECURITY: Use actual Stripe billing period, not generic 30-day reset
  if (!business.currentPeriodStart || !business.currentPeriodEnd) {
    // Subscription not properly configured yet
    return { withinLimit: true, usageCount: 0, includedAppointments: 0, overageCount: 0 };
  }

  const settings = await getBusinessSettings();
  const includedAppointments = settings.business30IncludedAppointments;

  // SECURITY: Try to create BusinessUsage record for this appointment
  // The UNIQUE constraint on appointmentId ensures it's only counted once
  try {
    await prisma.businessUsage.create({
      data: {
        businessId,
        appointmentId,
        stripeSubscriptionId: business.stripeSubscriptionId,
        billingPeriodStart: business.currentPeriodStart,
        billingPeriodEnd: business.currentPeriodEnd,
        isOverage: false, // Will be updated if needed
        overageAmountCents: 0,
      },
    });
  } catch (error: any) {
    // If appointment is already in usage table, return early (idempotent)
    if (error.code === 'P2002') {
      // Unique constraint violation - appointment already counted
      // Query existing usage to return accurate data
      const existingUsage = await prisma.businessUsage.findUnique({
        where: { appointmentId },
      });

      if (existingUsage) {
        const usageInPeriod = await prisma.businessUsage.count({
          where: {
            businessId,
            billingPeriodStart: business.currentPeriodStart,
            billingPeriodEnd: business.currentPeriodEnd,
          },
        });

        const withinLimit = usageInPeriod <= includedAppointments;
        const overageCount = Math.max(0, usageInPeriod - includedAppointments);
        return { withinLimit, usageCount: usageInPeriod, includedAppointments, overageCount };
      }
    }
    throw error;
  }

  // Count total usage in current billing period
  const usageInPeriod = await prisma.businessUsage.count({
    where: {
      businessId,
      billingPeriodStart: business.currentPeriodStart,
      billingPeriodEnd: business.currentPeriodEnd,
    },
  });

  const withinLimit = usageInPeriod <= includedAppointments;
  const overageCount = Math.max(0, usageInPeriod - includedAppointments);

  // Update the BusinessUsage record to mark if it's an overage
  if (!withinLimit) {
    await prisma.businessUsage.update({
      where: { appointmentId },
      data: {
        isOverage: true,
        overageAmountCents: 5000, // $50 per overage appointment
      },
    });
  }

  return { withinLimit, usageCount: usageInPeriod, includedAppointments, overageCount };
}

/**
 * Create an overage invoice for appointments beyond the included amount
 */
export async function createOverageInvoice(input: {
  businessId: string;
  overageCount: number;
  overageFeeCents: number;
}): Promise<string | null> {
  const business = await prisma.business.findUnique({
    where: { id: input.businessId },
    include: { invoices: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!business) return null;

  // SECURITY: Only query unbilled overages in CURRENT Stripe billing period
  // This prevents invoicing historical overages from past periods
  if (!business.currentPeriodStart || !business.currentPeriodEnd) {
    return null; // Subscription not properly configured
  }

  const overageAppointments = await prisma.businessUsage.findMany({
    where: {
      businessId: input.businessId,
      // CRITICAL: Only select unbilled overages
      billingStatus: "unbilled",
      isOverage: true,
      overageAmountCents: { gt: 0 },
      invoiceId: null,
      // CRITICAL: Only overages from CURRENT billing period
      billingPeriodStart: business.currentPeriodStart,
      billingPeriodEnd: business.currentPeriodEnd,
    },
  });

  if (overageAppointments.length === 0) {
    return null;
  }

  const lastInvoiceNumber = business.invoices[0]?.invoiceNumber || "INV-0000";
  const nextNumber = `INV-${(parseInt(lastInvoiceNumber.split("-")[1]) + 1).toString().padStart(4, "0")}`;

  const totalCents = overageAppointments.reduce((sum, apt) => sum + apt.overageAmountCents, 0);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 15);

  // CRITICAL: Use transaction to atomically create invoice and update billing state
  // This prevents concurrent requests from double-invoicing the same overage
  const result = await prisma.$transaction(async (tx: any) => {
    // Create the invoice
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber: nextNumber,
        businessId: input.businessId,
        clientName: business.companyName,
        company: business.companyName,
        email: business.billingContactEmail || business.email,
        issueDate: new Date(),
        dueDate,
        status: "sent",
        notes: `Business30 Plan - Additional Appointments (${overageAppointments.length} × $${input.overageFeeCents / 100})`,
        items: {
          create: {
            description: `Additional Service Appointments (${overageAppointments.length})`,
            type: "other_service",
            quantity: overageAppointments.length,
            unitAmountCents: input.overageFeeCents,
            amountCents: totalCents,
          },
        },
      },
    });

    // CRITICAL: Mark all included overages as invoiced in the SAME transaction
    // This ensures atomicity: either ALL are updated or NONE
    const now = new Date();
    await Promise.all(
      overageAppointments.map((apt: any) =>
        tx.businessUsage.update({
          where: { id: apt.id },
          data: {
            billingStatus: "invoiced",
            invoiceId: invoice.id,
            invoicedAt: now,
          },
        })
      )
    );

    return invoice;
  }, {
    // Serializable isolation prevents concurrent double-billing
    isolationLevel: "Serializable" as any,
  });

  return result.id;
}
