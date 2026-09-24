"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { generateConfirmationNumber } from "@/lib/utils";
import { createNotification } from "@/lib/actions/notifications";
import { requireAdminSession } from "@/lib/auth";
import { syncRevenueForAppointment } from "@/lib/payments";
import { datetimeLocalToUtc } from "@/lib/tz";
import { syncBusinessUsageSafe } from "@/lib/usage";

export interface AppointmentInput {
  type: string;
  status: string;
  clientId?: string;
  businessId?: string;
  clientName: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  serviceType: string;
  documentType: string;
  numberOfActs: number;
  statutoryFeeCents: number;
  travelFeeCents: number;
  otherFeesCents: number;
  totalAmountCents: number;
  scheduledStart: string; // datetime-local value, America/Detroit wall time
  paymentStatus: string;
  paymentMethod: string;
  notes: string;
  followUpDate?: string;
  isRecurring: boolean;
  recurrenceRule: string;
}

export async function createAppointment(input: AppointmentInput) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const start = datetimeLocalToUtc(input.scheduledStart);
  if (!start) return { success: false, error: "Please enter a valid date and time" };
  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  const duration = settings?.appointmentDurationMinutes ?? 20;
  const end = new Date(start.getTime() + duration * 60000);

  const appointment = await prisma.appointment.create({
    data: {
      confirmationNumber: generateConfirmationNumber(),
      type: input.type,
      status: input.status,
      paymentStatus: input.paymentStatus,
      paymentMethod: input.paymentMethod,
      clientId: input.clientId || null,
      businessId: input.businessId || null,
      clientName: input.clientName,
      company: input.company,
      email: input.email,
      phone: input.phone,
      address: input.address,
      serviceType: input.serviceType,
      documentType: input.documentType,
      numberOfActs: input.numberOfActs,
      statutoryFeeCents: input.statutoryFeeCents,
      travelFeeCents: input.travelFeeCents,
      otherFeesCents: input.otherFeesCents,
      totalAmountCents: input.totalAmountCents,
      scheduledStart: start,
      scheduledEnd: end,
      notes: input.notes,
      followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
      isRecurring: input.isRecurring,
      recurrenceRule: input.recurrenceRule,
      source: "admin",
      completedAt: input.status === "completed" ? new Date() : null,
    },
  });

  await syncRevenueForAppointment(appointment.id);
  await syncBusinessUsageSafe(appointment.businessId);
  await createNotification({
    type: "appointment_upcoming",
    title: "Appointment scheduled",
    body: `${input.clientName} — ${input.serviceType}`,
    link: `/admin/appointments/${appointment.id}`,
  });

  revalidatePath("/admin/appointments");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin");
  return { success: true, id: appointment.id };
}

export async function updateAppointment(id: string, input: AppointmentInput) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const existing = await prisma.appointment.findUnique({ where: { id } });
  const start = datetimeLocalToUtc(input.scheduledStart);
  if (!start) return { success: false, error: "Please enter a valid date and time" };
  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  const duration = settings?.appointmentDurationMinutes ?? 20;
  const end = new Date(start.getTime() + duration * 60000);
  const timeChanged = existing && existing.scheduledStart.getTime() !== start.getTime();

  await prisma.appointment.update({
    where: { id },
    data: {
      type: input.type,
      status: input.status,
      paymentStatus: input.paymentStatus,
      paymentMethod: input.paymentMethod,
      clientId: input.clientId || null,
      businessId: input.businessId || null,
      clientName: input.clientName,
      company: input.company,
      email: input.email,
      phone: input.phone,
      address: input.address,
      serviceType: input.serviceType,
      documentType: input.documentType,
      numberOfActs: input.numberOfActs,
      statutoryFeeCents: input.statutoryFeeCents,
      travelFeeCents: input.travelFeeCents,
      otherFeesCents: input.otherFeesCents,
      totalAmountCents: input.totalAmountCents,
      scheduledStart: start,
      scheduledEnd: end,
      notes: input.notes,
      followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
      isRecurring: input.isRecurring,
      recurrenceRule: input.recurrenceRule,
      completedAt:
        input.status === "completed"
          ? existing?.status === "completed" ? existing.completedAt ?? new Date() : new Date()
          : null,
    },
  });

  await syncRevenueForAppointment(id);
  // Status, date or business may have changed — recount both old and new business.
  await syncBusinessUsageSafe(existing?.businessId, input.businessId);

  if (timeChanged && input.email) {
    const { sendAppointmentChangedEmail } = await import("@/lib/email");
    await sendAppointmentChangedEmail({
      to: input.email,
      name: input.clientName,
      appointmentId: id,
      confirmationNumber: existing!.confirmationNumber,
      serviceType: input.serviceType,
      scheduledStart: start,
    });
  }

  revalidatePath("/admin/appointments");
  revalidatePath(`/admin/appointments/${id}`);
  revalidatePath("/admin/calendar");
  revalidatePath("/admin");
  revalidatePath("/admin/goal");
  return { success: true };
}

export async function setAppointmentStatus(id: string, status: string) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const before = await prisma.appointment.findUnique({ where: { id } });
  await prisma.appointment.update({
    where: { id },
    data: {
      status,
      completedAt: status === "completed" ? (before?.status === "completed" ? before.completedAt ?? new Date() : new Date()) : null,
    },
  });
  await syncRevenueForAppointment(id);
  await syncBusinessUsageSafe(before?.businessId);

  if (before && status === "cancelled" && before.status !== "cancelled" && before.email) {
    const { sendAppointmentCancelledEmail } = await import("@/lib/email");
    await sendAppointmentCancelledEmail({
      to: before.email,
      name: before.clientName,
      confirmationNumber: before.confirmationNumber,
      serviceType: before.serviceType,
      scheduledStart: before.scheduledStart,
    });
  }

  revalidatePath("/admin/appointments");
  revalidatePath(`/admin/appointments/${id}`);
  revalidatePath("/admin/calendar");
  revalidatePath("/admin");
  revalidatePath("/admin/goal");
  revalidatePath("/portal", "layout");
  return { success: true };
}

export async function setAppointmentPaymentStatus(id: string, paymentStatus: string) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  await prisma.appointment.update({ where: { id }, data: { paymentStatus } });
  await syncRevenueForAppointment(id);
  revalidatePath("/admin/appointments");
  revalidatePath(`/admin/appointments/${id}`);
  revalidatePath("/admin");
  revalidatePath("/admin/goal");
  return { success: true };
}

export async function deleteAppointment(id: string) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const existingEntry = await prisma.revenueEntry.findFirst({ where: { appointmentId: id } });
  if (existingEntry) await prisma.revenueEntry.delete({ where: { id: existingEntry.id } });
  const deleted = await prisma.appointment.delete({ where: { id } });
  await syncBusinessUsageSafe(deleted.businessId);
  revalidatePath("/admin/appointments");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin");
  return { success: true };
}
