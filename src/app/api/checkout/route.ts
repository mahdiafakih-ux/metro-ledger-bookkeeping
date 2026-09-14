import { NextRequest, NextResponse } from "next/server";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";
import {
  createIndividualCheckoutSession,
  createBusiness30CheckoutSession,
  createUnlimitedCheckoutSession,
} from "@/lib/subscriptions";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { requireClientSession } from "@/lib/client-auth";

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { planType, appointmentId } = body;

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

      if (!appointmentId) {
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

    if (planType === "business30" || planType === "unlimited") {
      // Business subscription - allow:
      // 1. Admin users (can manage any business)
      // 2. Authorized business clients with owner or admin role

      const adminSession = await requireAdminSession();
      const clientSession = adminSession ? null : await requireClientSession();

      if (!adminSession && !clientSession) {
        return NextResponse.json(
          { error: "Unauthorized: Admin or business client access required" },
          { status: 401 }
        );
      }

      const { businessId } = body;
      if (!businessId) {
        return NextResponse.json(
          { error: "Missing businessId" },
          { status: 400 }
        );
      }

      const business = await prisma.business.findUnique({
        where: { id: businessId },
      });

      if (!business) {
        return NextResponse.json(
          { error: "Business not found" },
          { status: 404 }
        );
      }

      // SECURITY: If client session (not admin), verify authorization via BusinessClient
      if (clientSession && !adminSession) {
        // Query the explicit BusinessClient relationship
        const businessClient = await prisma.businessClient.findUnique({
          where: {
            businessId_clientId: {
              businessId,
              clientId: clientSession.clientId,
            },
          },
          select: { role: true },
        });

        // SECURITY: Only owner and admin roles can manage subscriptions
        if (!businessClient || (businessClient.role !== "owner" && businessClient.role !== "admin")) {
          return NextResponse.json(
            {
              error: "Forbidden: You do not have permission to manage subscriptions for this business. Contact the business owner.",
            },
            { status: 403 }
          );
        }
      }

      if (planType === "business30") {
        const sessionId = await createBusiness30CheckoutSession({
          businessId,
          businessEmail: business.billingContactEmail || business.email,
          businessName: business.companyName,
        });

        if (!sessionId) {
          return NextResponse.json(
            { error: "Failed to create checkout session" },
            { status: 500 }
          );
        }

        const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
        return NextResponse.json({
          sessionId,
          publishableKey,
        });
      }

      if (planType === "unlimited") {
        const sessionId = await createUnlimitedCheckoutSession({
          businessId,
          businessEmail: business.billingContactEmail || business.email,
          businessName: business.companyName,
        });

        if (!sessionId) {
          return NextResponse.json(
            { error: "Failed to create checkout session" },
            { status: 500 }
          );
        }

        const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
        return NextResponse.json({
          sessionId,
          publishableKey,
        });
      }
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
