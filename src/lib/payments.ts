import { prisma } from "@/lib/db";
import { getTotalEarnedCents } from "@/lib/queries/dashboard";
import { checkAndRecordMilestones } from "@/lib/actions/revenue";
import { createNotification } from "@/lib/actions/notifications";

/**
 * Shared payment-state mutation logic. Deliberately NOT a "use server" file —
 * it's imported both by admin Server Actions and by the Stripe webhook Route
 * Handler, which is not itself a Server Action.
 */

export async function recordAppointmentPayment(input: {
  appointmentId: string;
  amountCents: number;
  method: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
}) {
  const appointment = await prisma.appointment.findUnique({ where: { id: input.appointmentId } });
  if (!appointment) return;

  const existingPayment = input.stripePaymentIntentId
    ? await prisma.payment.findFirst({ where: { stripePaymentIntentId: input.stripePaymentIntentId, appointmentId: appointment.id } })
    : null;
  if (existingPayment) return; // idempotent — webhook may retry the same event

  await prisma.payment.create({
    data: {
      appointmentId: appointment.id,
      amountCents: input.amountCents,
      method: input.method,
      status: "succeeded",
      stripePaymentIntentId: input.stripePaymentIntentId ?? "",
      stripeChargeId: input.stripeChargeId ?? "",
    },
  });

  const newAmountPaid = appointment.amountPaidCents + input.amountCents;
  const newStatus = newAmountPaid >= appointment.totalAmountCents ? "paid" : "partially_paid";

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { amountPaidCents: newAmountPaid, paymentStatus: newStatus },
  });

  if (newStatus === "paid") {
    await syncRevenueForAppointment(appointment.id);
  }

  await createNotification({
    type: "payment_received",
    title: `Payment received — ${appointment.clientName}`,
    body: `${(input.amountCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })} via ${input.method}`,
    link: `/admin/appointments/${appointment.id}`,
  });

  if (appointment.email) {
    const { sendPaymentReceiptEmail } = await import("@/lib/email");
    await sendPaymentReceiptEmail({
      to: appointment.email,
      name: appointment.clientName,
      amountCents: input.amountCents,
      description: `${appointment.serviceType} (${appointment.confirmationNumber})`,
      method: input.method,
    });
  }
}

export async function syncRevenueForAppointment(appointmentId: string) {
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt) return;

  const existingEntry = await prisma.revenueEntry.findFirst({ where: { appointmentId } });
  // Revenue is recognized on cash basis at time of payment, independent of
  // appointment status — cancelling an already-paid appointment doesn't
  // silently erase received revenue; only an explicit refund does that.
  const shouldHaveRevenue = appt.paymentStatus === "paid" && appt.totalAmountCents > 0;

  if (shouldHaveRevenue && !existingEntry) {
    const beforeTotal = await getTotalEarnedCents();
    await prisma.revenueEntry.create({
      data: {
        amountCents: appt.totalAmountCents,
        source: "appointment",
        description: `${appt.serviceType} — ${appt.clientName}`,
        appointmentId: appt.id,
        date: appt.scheduledStart,
      },
    });
    await checkAndRecordMilestones(beforeTotal, beforeTotal + appt.totalAmountCents);
  } else if (!shouldHaveRevenue && existingEntry) {
    await prisma.revenueEntry.delete({ where: { id: existingEntry.id } });
  }
}

export async function recordInvoicePayment(input: {
  invoiceId: string;
  amountCents: number;
  method: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
}) {
  const invoice = await prisma.invoice.findUnique({ where: { id: input.invoiceId }, include: { items: true } });
  if (!invoice) return;

  const existingPayment = input.stripePaymentIntentId
    ? await prisma.payment.findFirst({ where: { stripePaymentIntentId: input.stripePaymentIntentId, invoiceId: invoice.id } })
    : null;
  if (existingPayment) return;

  await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      amountCents: input.amountCents,
      method: input.method,
      status: "succeeded",
      stripePaymentIntentId: input.stripePaymentIntentId ?? "",
      stripeChargeId: input.stripeChargeId ?? "",
    },
  });

  const invoiceTotal = invoice.items.reduce((sum, i) => sum + i.amountCents, 0) + invoice.taxCents;
  const newAmountPaid = invoice.amountPaidCents + input.amountCents;
  const newStatus = newAmountPaid >= invoiceTotal ? "paid" : "partially_paid";

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { amountPaidCents: newAmountPaid, status: newStatus },
  });

  if (newStatus === "paid") {
    const existingEntry = await prisma.revenueEntry.findFirst({ where: { invoiceId: invoice.id } });
    if (!existingEntry) {
      const beforeTotal = await getTotalEarnedCents();
      await prisma.revenueEntry.create({
        data: {
          amountCents: invoiceTotal,
          source: "invoice",
          description: `Invoice ${invoice.invoiceNumber} — ${invoice.clientName}`,
          invoiceId: invoice.id,
        },
      });
      await checkAndRecordMilestones(beforeTotal, beforeTotal + invoiceTotal);
    }
  }

  await createNotification({
    type: "payment_received",
    title: `Payment received — Invoice ${invoice.invoiceNumber}`,
    body: `${(input.amountCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })} via ${input.method}`,
    link: `/admin/invoices/${invoice.id}`,
  });

  if (invoice.email) {
    const { sendPaymentReceiptEmail } = await import("@/lib/email");
    await sendPaymentReceiptEmail({
      to: invoice.email,
      name: invoice.clientName,
      amountCents: input.amountCents,
      description: `Invoice ${invoice.invoiceNumber}`,
      method: input.method,
    });
  }
}

export async function markAppointmentPaymentFailed(appointmentId: string) {
  await prisma.appointment.update({ where: { id: appointmentId }, data: { paymentStatus: "failed" } });
}

export async function markInvoicePaymentFailed(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return;
  if (invoice.amountPaidCents === 0) {
    await prisma.invoice.update({ where: { id: invoiceId }, data: { status: "overdue" } });
  }
}

export async function recordRefund(input: { paymentId: string; stripeRefundId?: string; amountCents?: number }) {
  const payment = await prisma.payment.findUnique({ where: { id: input.paymentId } });
  if (!payment) return { success: false, error: "Payment not found" };

  const refundAmount = input.amountCents ?? payment.amountCents;

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "refunded", stripeRefundId: input.stripeRefundId ?? "" },
  });

  await prisma.revenueEntry.create({
    data: {
      amountCents: -refundAmount,
      source: "refund",
      description: "Refund issued",
      appointmentId: payment.appointmentId,
      invoiceId: payment.invoiceId,
    },
  });

  if (payment.appointmentId) {
    const appt = await prisma.appointment.findUnique({ where: { id: payment.appointmentId } });
    if (appt) {
      const newPaid = Math.max(0, appt.amountPaidCents - refundAmount);
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { amountPaidCents: newPaid, paymentStatus: newPaid <= 0 ? "refunded" : "partially_paid" },
      });
    }
  }
  if (payment.invoiceId) {
    const invoice = await prisma.invoice.findUnique({ where: { id: payment.invoiceId } });
    if (invoice) {
      const newPaid = Math.max(0, invoice.amountPaidCents - refundAmount);
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { amountPaidCents: newPaid, status: newPaid <= 0 ? "refunded" : "partially_paid" },
      });
    }
  }

  return { success: true };
}
