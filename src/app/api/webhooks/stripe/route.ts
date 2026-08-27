import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import {
  recordAppointmentPayment,
  recordInvoicePayment,
  markAppointmentPaymentFailed,
  markInvoicePaymentFailed,
} from "@/lib/payments";

// Route handlers receive the raw body only if we opt out of body parsing —
// Next.js App Router route handlers already give us the raw stream via
// request.text(), which is exactly what Stripe's signature check needs.
export async function POST(request: NextRequest) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    // Payments aren't configured — nothing to verify or process.
    return NextResponse.json({ received: false, error: "Stripe not configured" }, { status: 400 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const type = session.metadata?.type;
        const amountCents = session.amount_total ?? 0;
        const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? "";

        if (type === "appointment" && session.metadata?.appointmentId) {
          await recordAppointmentPayment({
            appointmentId: session.metadata.appointmentId,
            amountCents,
            method: "stripe",
            stripePaymentIntentId: paymentIntentId,
          });
        } else if (type === "invoice" && session.metadata?.invoiceId) {
          await recordInvoicePayment({
            invoiceId: session.metadata.invoiceId,
            amountCents,
            method: "stripe",
            stripePaymentIntentId: paymentIntentId,
          });
        }
        break;
      }

      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const type = session.metadata?.type;
        if (type === "appointment" && session.metadata?.appointmentId) {
          await markAppointmentPaymentFailed(session.metadata.appointmentId);
        } else if (type === "invoice" && session.metadata?.invoiceId) {
          await markInvoicePaymentFailed(session.metadata.invoiceId);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const type = intent.metadata?.type;
        if (type === "appointment" && intent.metadata?.appointmentId) {
          await markAppointmentPaymentFailed(intent.metadata.appointmentId);
        } else if (type === "invoice" && intent.metadata?.invoiceId) {
          await markInvoicePaymentFailed(intent.metadata.invoiceId);
        }
        break;
      }

      case "charge.refunded": {
        // Refunds initiated directly from the Stripe Dashboard (rather than
        // through our admin refund action) still need to reflect locally.
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        if (paymentIntentId) {
          const payment = await prisma.payment.findFirst({ where: { stripePaymentIntentId: paymentIntentId, status: "succeeded" } });
          if (payment) {
            const { recordRefund } = await import("@/lib/payments");
            await recordRefund({ paymentId: payment.id, stripeRefundId: charge.refunds?.data?.[0]?.id ?? "" });
          }
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("Stripe webhook handler error:", err instanceof Error ? err.message : err);
    // Return 500 so Stripe retries with backoff — losing a payment update
    // silently is worse than a few redundant retries (handlers are
    // idempotent via the stripePaymentIntentId check).
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
