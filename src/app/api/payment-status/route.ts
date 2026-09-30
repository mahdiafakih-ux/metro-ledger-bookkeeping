import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireClientSession } from "@/lib/client-auth";

/**
 * GET /api/payment-status?sessionId=...
 *
 * Return the current payment status for a Stripe Checkout Session.
 * Used by the payment-success page to poll for payment confirmation.
 *
 * SECURITY: Requires client authentication to prevent information disclosure.
 * The success page is only accessible by authenticated clients in their own portal.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing sessionId parameter" },
      { status: 400 }
    );
  }

  // SECURITY: Require authenticated client session
  const clientSession = await requireClientSession();
  if (!clientSession) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Search for a Payment record with this Checkout Session ID
    const payment = await prisma.payment.findFirst({
      where: { stripeCheckoutSessionId: sessionId },
      include: {
        appointment: true,
        invoice: true,
      },
    });

    if (!payment) {
      // Payment not yet recorded — still processing
      return NextResponse.json({
        status: "processing",
      });
    }

    // SECURITY: Verify the payment belongs to the authenticated client
    // Check both appointment and invoice ownership
    if (payment.appointment && payment.appointment.clientId !== clientSession.clientId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    if (payment.invoice && payment.invoice.clientId !== clientSession.clientId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Payment found and authorized — return status
    return NextResponse.json({
      status: payment.status === "succeeded" ? "paid" : (payment.status === "failed" ? "failed" : "processing"),
      amountCents: payment.amountCents,
      appointmentId: payment.appointmentId,
      invoiceId: payment.invoiceId,
      paidAt: payment.paidAt,
    });
  } catch (error) {
    console.error("Error fetching payment status:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment status" },
      { status: 500 }
    );
  }
}
