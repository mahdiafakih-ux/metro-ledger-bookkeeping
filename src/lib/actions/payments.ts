"use server";

import { prisma } from "@/lib/db";
import { getStripeClient, getSiteUrl } from "@/lib/stripe";
import { requireAdminSession } from "@/lib/auth";
import { recordRefund } from "@/lib/payments";
import { revalidatePath } from "next/cache";

export interface CheckoutResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Builds the Stripe Checkout line items for an appointment, itemizing the
 * Michigan statutory notarial fee separately from every other charge — the
 * line item names deliberately never call a non-notarial charge a "notary
 * fee."
 */
export async function createAppointmentCheckoutSession(appointmentId: string): Promise<CheckoutResult> {
  const stripe = getStripeClient();
  if (!stripe) return { success: false, error: "Online payment is not configured yet. Please pay at your appointment." };

  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appointment) return { success: false, error: "Appointment not found" };
  if (appointment.paymentStatus === "paid") return { success: false, error: "This appointment is already paid." };

  const balanceDueCents = appointment.totalAmountCents - appointment.amountPaidCents;
  if (balanceDueCents <= 0) return { success: false, error: "Nothing due on this appointment." };

  const lineItems: Array<{ price_data: { currency: string; product_data: { name: string; description?: string }; unit_amount: number }; quantity: number }> = [];

  if (appointment.statutoryFeeCents > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: `Michigan Statutory Notarial Fee (${appointment.numberOfActs} act${appointment.numberOfActs === 1 ? "" : "s"})`,
          description: "Capped at $10 per notarial act under Michigan law (MCL 55.287).",
        },
        unit_amount: appointment.statutoryFeeCents,
      },
      quantity: 1,
    });
  }
  const otherCents = appointment.travelFeeCents + appointment.otherFeesCents;
  if (otherCents > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Signing Agent, Travel & Administrative Service Fee",
          description: "Lawful business service charge — separate from, and not part of, the notarial act fee.",
        },
        unit_amount: otherCents,
      },
      quantity: 1,
    });
  }
  if (lineItems.length === 0) return { success: false, error: "Nothing due on this appointment." };

  const site = getSiteUrl();
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${site}/book/confirmation/${appointment.id}?paid=1`,
      cancel_url: `${site}/book/confirmation/${appointment.id}`,
      customer_email: appointment.email || undefined,
      metadata: { type: "appointment", appointmentId: appointment.id },
      payment_intent_data: { metadata: { type: "appointment", appointmentId: appointment.id } },
    });
  } catch (err) {
    console.error("Stripe checkout session creation failed:", err instanceof Error ? err.message : err);
    return { success: false, error: "Could not start checkout right now. Please try again or pay at your appointment." };
  }

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { stripeCheckoutSessionId: session.id, paymentStatus: appointment.paymentStatus === "unpaid" ? "pending" : appointment.paymentStatus },
  });

  return { success: true, url: session.url ?? undefined };
}

/** Builds a Stripe Checkout session for an invoice — usable from the public, unauthenticated invoice-pay page. */
export async function createInvoiceCheckoutSession(invoiceId: string): Promise<CheckoutResult> {
  const stripe = getStripeClient();
  if (!stripe) return { success: false, error: "Online payment is not configured yet." };

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { items: true } });
  if (!invoice) return { success: false, error: "Invoice not found" };

  const invoiceTotal = invoice.items.reduce((sum, i) => sum + i.amountCents, 0) + invoice.taxCents;
  const balanceDueCents = invoiceTotal - invoice.amountPaidCents;
  if (balanceDueCents <= 0) return { success: false, error: "This invoice is already paid in full." };

  const lineItems = invoice.items.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.type === "statutory_fee" ? `Michigan Statutory Notarial Fee — ${item.description}` : item.description,
        description: item.type === "statutory_fee" ? "Capped at $10 per notarial act under Michigan law (MCL 55.287)." : "Lawful business service charge — separate from the notarial act fee.",
      },
      unit_amount: item.unitAmountCents,
    },
    quantity: item.quantity,
  }));

  if (invoice.taxCents > 0) {
    lineItems.push({
      price_data: { currency: "usd", product_data: { name: "Tax", description: "" }, unit_amount: invoice.taxCents },
      quantity: 1,
    });
  }

  const site = getSiteUrl();
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${site}/invoice/${invoice.id}?paid=1`,
      cancel_url: `${site}/invoice/${invoice.id}`,
      customer_email: invoice.email || undefined,
      metadata: { type: "invoice", invoiceId: invoice.id },
      payment_intent_data: { metadata: { type: "invoice", invoiceId: invoice.id } },
    });
  } catch (err) {
    console.error("Stripe checkout session creation failed:", err instanceof Error ? err.message : err);
    return { success: false, error: "Could not start checkout right now. Please try again shortly." };
  }

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { stripeCheckoutSessionId: session.id, stripePaymentLinkUrl: session.url ?? "" },
  });

  revalidatePath(`/admin/invoices/${invoice.id}`);
  return { success: true, url: session.url ?? undefined };
}

export async function recordManualPayment(input: { appointmentId?: string; invoiceId?: string; amountDollars: number; method: string }) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const amountCents = Math.round(input.amountDollars * 100);
  if (amountCents <= 0) return { success: false, error: "Amount must be greater than zero" };

  const { recordAppointmentPayment, recordInvoicePayment } = await import("@/lib/payments");

  if (input.appointmentId) {
    await recordAppointmentPayment({ appointmentId: input.appointmentId, amountCents, method: input.method });
    revalidatePath(`/admin/appointments/${input.appointmentId}`);
  } else if (input.invoiceId) {
    await recordInvoicePayment({ invoiceId: input.invoiceId, amountCents, method: input.method });
    revalidatePath(`/admin/invoices/${input.invoiceId}`);
  } else {
    return { success: false, error: "No target specified" };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/goal");
  revalidatePath("/admin/revenue");
  return { success: true };
}

export async function refundAppointmentPayment(appointmentId: string) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const payment = await prisma.payment.findFirst({ where: { appointmentId, status: "succeeded" }, orderBy: { createdAt: "desc" } });
  if (!payment) return { success: false, error: "No payment found to refund" };

  return refundPaymentById(payment.id);
}

export async function refundInvoicePayment(invoiceId: string) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const payment = await prisma.payment.findFirst({ where: { invoiceId, status: "succeeded" }, orderBy: { createdAt: "desc" } });
  if (!payment) return { success: false, error: "No payment found to refund" };

  return refundPaymentById(payment.id);
}

async function refundPaymentById(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return { success: false, error: "Payment not found" };

  let stripeRefundId = "";
  if (payment.stripePaymentIntentId) {
    const stripe = getStripeClient();
    if (stripe) {
      try {
        const refund = await stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId });
        stripeRefundId = refund.id;
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Stripe refund failed" };
      }
    }
  }

  const result = await recordRefund({ paymentId, stripeRefundId });
  revalidatePath("/admin/appointments");
  revalidatePath("/admin/invoices");
  revalidatePath("/admin");
  revalidatePath("/admin/goal");
  revalidatePath("/admin/revenue");
  return result;
}
