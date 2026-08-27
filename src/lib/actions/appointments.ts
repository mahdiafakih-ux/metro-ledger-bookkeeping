"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { generateConfirmationNumber } from "@/lib/utils";
import { createNotification } from "@/lib/actions/notifications";
import { checkAndRecordMilestones } from "@/lib/actions/revenue";
import { getTotalEarnedCents } from "@/lib/queries/dashboard";

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
  scheduledStart: string; // datetime-local value
  paymentStatus: string;
  paymentMethod: string;
  notes: string;
  followUpDate?: string;
  isRecurring: boolean;
  recurrenceRule: string;
}

async function syncRevenueForAppointment(appointmentId: string) {
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt) return;

  const existingEntry = await prisma.revenueEntry.findFirst({ where: { appointmentId } });
  const shouldHaveRevenue = appt.status === "completed" && appt.paymentStatus === "paid" && appt.totalAmountCents > 0;

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

export async function createAppointment(input: AppointmentInput) {
  const start = new Date(input.scheduledStart);
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
    },
  });

  await syncRevenueForAppointment(appointment.id);
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
  const start = new Date(input.scheduledStart);
  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  const duration = settings?.appointmentDurationMinutes ?? 20;
  const end = new Date(start.getTime() + duration * 60000);

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
    },
  });

  await syncRevenueForAppointment(id);
  revalidatePath("/admin/appointments");
  revalidatePath(`/admin/appointments/${id}`);
  revalidatePath("/admin/calendar");
  revalidatePath("/admin");
  revalidatePath("/admin/goal");
  return { success: true };
}

export async function setAppointmentStatus(id: string, status: string) {
  await prisma.appointment.update({ where: { id }, data: { status } });
  await syncRevenueForAppointment(id);
  revalidatePath("/admin/appointments");
  revalidatePath(`/admin/appointments/${id}`);
  revalidatePath("/admin/calendar");
  revalidatePath("/admin");
  revalidatePath("/admin/goal");
  return { success: true };
}

export async function setAppointmentPaymentStatus(id: string, paymentStatus: string) {
  await prisma.appointment.update({ where: { id }, data: { paymentStatus } });
  await syncRevenueForAppointment(id);
  revalidatePath("/admin/appointments");
  revalidatePath(`/admin/appointments/${id}`);
  revalidatePath("/admin");
  revalidatePath("/admin/goal");
  return { success: true };
}

export async function deleteAppointment(id: string) {
  const existingEntry = await prisma.revenueEntry.findFirst({ where: { appointmentId: id } });
  if (existingEntry) await prisma.revenueEntry.delete({ where: { id: existingEntry.id } });
  await prisma.appointment.delete({ where: { id } });
  revalidatePath("/admin/appointments");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin");
  return { success: true };
}
