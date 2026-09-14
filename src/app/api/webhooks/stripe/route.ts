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
import {
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
} from "@/lib/subscriptions";

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
        // SECURITY: Use transaction to atomically:
        // 1. Check if event already processed (via unique constraint)
        // 2. Record payment if new
        // 3. Mark event as processed
        // This prevents concurrent webhook deliveries from causing duplicate charges
        try {
          await prisma.$transaction(async (tx) => {
            const session = event.data.object as Stripe.Checkout.Session;
            const type = session.metadata?.type;
            const amountCents = session.amount_total ?? 0;
            const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? "";
            const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? "";

            // SECURITY: Validate Stripe session data
            if (!amountCents || amountCents <= 0) {
              console.error(`Invalid amount in checkout.session.completed: ${amountCents}`);
              return; // Skip invalid events
            }

            if (session.payment_status !== "paid") {
              console.warn(`Checkout session status not 'paid': ${session.payment_status}`);
              return; // Skip non-completed payments
            }

            // Handle individual service appointment payment (one-time)
            if ((type === "appointment" || type === "individual_appointment") && session.metadata?.appointmentId) {
              await recordAppointmentPayment({
                appointmentId: session.metadata.appointmentId,
                amountCents,
                method: "stripe",
                stripePaymentIntentId: paymentIntentId,
                stripeCheckoutSessionId: session.id,
                stripeCustomerId: customerId,
                invoiceId: session.metadata?.invoiceId, // Derived server-side, passed from checkout metadata
              });
            }
            // Handle invoice payment (for any invoice, including overages)
            else if (type === "invoice" && session.metadata?.invoiceId) {
              await recordInvoicePayment({
                invoiceId: session.metadata.invoiceId,
                amountCents,
                method: "stripe",
                stripePaymentIntentId: paymentIntentId,
                stripeCheckoutSessionId: session.id,
                stripeCustomerId: customerId,
              });
            }

            // Mark event as processed
            // This uses unique constraint on stripeEventId to prevent duplicate processing
            await tx.subscriptionEvent.create({
              data: {
                stripeEventId: event.id,
                eventType: "checkout.session.completed",
                stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : "",
                businessId: session.metadata?.businessId || undefined,
                clientId: session.metadata?.clientId || undefined,
                dataSnapshot: JSON.stringify(session),
              },
            });
          });
        } catch (error: any) {
          // If unique constraint on stripeEventId is violated, it means we already processed this event
          if (error?.code === "P2002" && error?.meta?.target?.includes("stripeEventId")) {
            console.info(`Event ${event.id} already processed, skipping`);
            // This is not an error - it's the idempotency mechanism working
            return;
          }
          // For other errors, re-throw
          throw error;
        }
        break;
      }

      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        // SECURITY: Use transaction for atomic idempotency
        try {
          await prisma.$transaction(async (tx) => {
            const session = event.data.object as Stripe.Checkout.Session;
            const type = session.metadata?.type;

            // Handle both old "appointment" and new "individual_appointment" types
            if ((type === "appointment" || type === "individual_appointment") && session.metadata?.appointmentId) {
              await markAppointmentPaymentFailed(session.metadata.appointmentId);
            } else if (type === "invoice" && session.metadata?.invoiceId) {
              await markInvoicePaymentFailed(session.metadata.invoiceId);
            }

            // Mark event as processed
            await tx.subscriptionEvent.create({
              data: {
                stripeEventId: event.id,
                eventType: event.type,
                stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : "",
                businessId: session.metadata?.businessId || undefined,
                clientId: session.metadata?.clientId || undefined,
                dataSnapshot: JSON.stringify(session),
              },
            });
          });
        } catch (error: any) {
          // If unique constraint on stripeEventId is violated, already processed
          if (error?.code === "P2002" && error?.meta?.target?.includes("stripeEventId")) {
            console.info(`Failure event ${event.id} already processed, skipping`);
            return;
          }
          throw error;
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

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        // Check for duplicate processing
        const existingEvent = await prisma.subscriptionEvent.findFirst({
          where: { stripeEventId: event.id },
        });
        if (!existingEvent) {
          await handleSubscriptionCreated(subscription);
          // Record event for idempotency
          await prisma.subscriptionEvent.create({
            data: {
              stripeEventId: event.id,
              eventType: "customer.subscription.created",
              stripeSubscriptionId: subscription.id,
              businessId: subscription.metadata?.businessId || undefined,
              clientId: subscription.metadata?.clientId || undefined,
              dataSnapshot: JSON.stringify(subscription),
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const existingEvent = await prisma.subscriptionEvent.findFirst({
          where: { stripeEventId: event.id },
        });
        if (!existingEvent) {
          await handleSubscriptionUpdated(subscription);
          await prisma.subscriptionEvent.create({
            data: {
              stripeEventId: event.id,
              eventType: "customer.subscription.updated",
              stripeSubscriptionId: subscription.id,
              businessId: subscription.metadata?.businessId || undefined,
              clientId: subscription.metadata?.clientId || undefined,
              dataSnapshot: JSON.stringify(subscription),
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const existingEvent = await prisma.subscriptionEvent.findFirst({
          where: { stripeEventId: event.id },
        });
        if (!existingEvent) {
          await handleSubscriptionDeleted(subscription);
          await prisma.subscriptionEvent.create({
            data: {
              stripeEventId: event.id,
              eventType: "customer.subscription.deleted",
              stripeSubscriptionId: subscription.id,
              businessId: subscription.metadata?.businessId || undefined,
              clientId: subscription.metadata?.clientId || undefined,
              dataSnapshot: JSON.stringify(subscription),
            },
          });
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
