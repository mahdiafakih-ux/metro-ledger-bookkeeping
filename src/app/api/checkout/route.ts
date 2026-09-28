import { NextRequest, NextResponse } from "next/server";
import { getSubscriptionPriceId, isStripeConfigured } from "@/lib/stripe";
import { createIndividualCheckoutSession, createBusinessSubscriptionCheckoutSession } from "@/lib/subscriptions";
import { prisma } from "@/lib/db";
import { requireClientSession } from "@/lib/client-auth";
import { authorizeBusinessManager } from "@/lib/business-auth";
import { SUBSCRIPTION_PLANS, isSubscriptionPlanKey } from "@/lib/plans";

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const planType: unknown = body?.planType;
    const appointmentId: unknown = body?.appointmentId;

    if (planType === "individual") {
      // Individual service appointment payment
      // SECURITY: Require authenticated client portal session
      const clientSession = await requireClientSession();
      if (!clientSession) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      if (typeof appointmentId !== "string" || !appointmentId) {
        return NextResponse.json(
          { error: "Missing appointmentId" },
          { status: 400 }
        );
      }

      // SECURITY: Verify appointment belongs to authenticated client
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { client: true },
      });

      if (!appointment) {
        return NextResponse.json(
          { error: "Appointment not found" },
          { status: 404 }
        );
      }

      // Verify ownership: appointment must belong to authenticated client
      if (appointment.clientId !== clientSession.clientId) {
        return NextResponse.json(
          { error: "Forbidden: This appointment does not belong to your account" },
          { status: 403 }
        );
      }

      // SECURITY: Use authenticated client info from session/database, not browser
      const client = clientSession.clientId ? await prisma.client.findUnique({
        where: { id: clientSession.clientId },
      }) : null;

      if (!client) {
        return NextResponse.json(
          { error: "Client not found" },
          { status: 404 }
        );
      }

      // SECURITY: Derive invoice entirely server-side from appointment relationship
      // Do NOT trust browser-supplied invoiceId
      // Load the appointment with its related invoice
      const appointmentWithInvoice = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { invoice: true },
      });

      // Check if appointment has a related invoice
      let invoiceId: string | undefined;
      if (appointmentWithInvoice?.invoice) {
        const invoice = appointmentWithInvoice.invoice;

        // Verify invoice is not already paid
        if (invoice.status === "paid") {
          return NextResponse.json(
            { error: "This invoice has already been paid" },
            { status: 409 }
          );
        }

        // Verify invoice belongs to the same client
        if (invoice.clientId !== clientSession.clientId) {
          return NextResponse.json(
            { error: "Forbidden: Invoice does not belong to your account" },
            { status: 403 }
          );
        }

        invoiceId = invoice.id;
      }
      // If no invoice exists, that's ok - we'll link the payment to appointment only

      const result = await createIndividualCheckoutSession({
        clientId: client.id,
        clientEmail: client.email,
        clientName: client.name,
        appointmentId,
        invoiceId,
        totalAmountCents: appointment.totalAmountCents,
        serviceType: appointment.serviceType,
      });

      if (!result) {
        return NextResponse.json(
          { error: "Failed to create checkout session" },
          { status: 500 }
        );
      }

      // Store session ID and customer ID in appointment for webhook reference
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { stripeCheckoutSessionId: result.sessionId },
      });

      // SECURITY: Store Stripe customer ID on client for future use
      if (result.customerId && !client.stripeCustomerId) {
        await prisma.client.update({
          where: { id: client.id },
          data: { stripeCustomerId: result.customerId },
        });
      }

      const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
      return NextResponse.json({
        sessionId: result.sessionId,
        publishableKey,
      });
    }

    if (planType === "unlimited") {
      // Business Unlimited is discontinued. Existing subscriptions keep
      // working (webhooks still recognise them); new purchases are refused.
      return NextResponse.json(
        { error: "Business Unlimited is no longer available. Choose Business10 or Business30." },
        { status: 410 }
      );
    }

    if (isSubscriptionPlanKey(planType)) {
      const businessId = typeof body.businessId === "string" ? body.businessId : "";
      if (!businessId) {
        return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
      }

      // SECURITY: admin, or a portal client with owner/admin role on this business.
      const auth = await authorizeBusinessManager(businessId);
      if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

      if (!getSubscriptionPriceId(planType)) {
        return NextResponse.json(
          { error: `${SUBSCRIPTION_PLANS[planType].name} isn't available for online checkout yet (Stripe price not configured).` },
          { status: 503 }
        );
      }

      const business = await prisma.business.findUnique({ where: { id: businessId } });
      if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

      // One live subscription per business: switching plans goes through
      // /api/subscription/change so Stripe prorates instead of double-billing.
      if (business.stripeSubscriptionId && ["active", "past_due", "incomplete"].includes(business.subscriptionStatus)) {
        return NextResponse.json(
          { error: "This business already has an active subscription. Use Change Plan instead." },
          { status: 409 }
        );
      }

      const session = await createBusinessSubscriptionCheckoutSession({
        planKey: planType,
        businessId,
        businessEmail: business.billingContactEmail || business.email,
        businessName: business.companyName,
        existingCustomerId: business.stripeCustomerId || undefined,
      });
      if (!session) {
        return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
      }

      if (!business.stripeCustomerId && session.customerId) {
        await prisma.business.update({ where: { id: businessId }, data: { stripeCustomerId: session.customerId } });
      }

      return NextResponse.json({
        sessionId: session.id,
        url: session.url,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      });
    }

    return NextResponse.json(
      { error: "Invalid planType" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
