"use server";

import { prisma } from "@/lib/db";
import { bookingSchema, type BookingInput } from "@/lib/validation";
import { generateConfirmationNumber } from "@/lib/utils";
import { getOpenSlotsForDate } from "@/lib/availability";
import { createNotification } from "@/lib/actions/notifications";

export async function getAvailableSlotsAction(dateISO: string) {
  return getOpenSlotsForDate(dateISO);
}

export interface BookingResult {
  success: boolean;
  error?: string;
  confirmationNumber?: string;
  appointmentId?: string;
  pricing?: { statutoryFeeCents: number; serviceFeeCents: number; totalCents: number };
}

export async function submitBooking(input: BookingInput): Promise<BookingResult> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.data ? "Invalid input" : parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  // Re-validate the slot is still open (defends against double-booking / race conditions)
  const openSlots = await getOpenSlotsForDate(data.date);
  if (!openSlots.some((s) => s.value === data.time)) {
    return { success: false, error: "That time slot is no longer available. Please choose another." };
  }

  const individualPlan = await prisma.pricingPlan.findUnique({ where: { key: "individual" } });
  const statutoryFeeCents = data.numberOfActs * (individualPlan?.statutoryFeeCents ?? 1000);
  const serviceFeeCents = individualPlan?.serviceFeeCents ?? 11500;
  const totalCents = statutoryFeeCents + serviceFeeCents;

  const [hh, mm] = data.time.split(":").map(Number);
  const start = new Date(`${data.date}T00:00:00`);
  start.setHours(hh, mm, 0, 0);
  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  const duration = settings?.appointmentDurationMinutes ?? 20;
  const end = new Date(start.getTime() + duration * 60000);

  const existingClient = data.email ? await prisma.client.findFirst({ where: { email: data.email } }) : null;
  const client = existingClient
    ? await prisma.client.update({
        where: { id: existingClient.id },
        data: {
          name: data.name,
          phone: data.phone,
          company: data.company || existingClient.company,
          lastAppointmentDate: start,
          totalAppointments: { increment: 1 },
        },
      })
    : await prisma.client.create({
        data: {
          email: data.email,
          name: data.name,
          phone: data.phone,
          company: data.company || "",
          leadStatus: "active_client",
          leadSource: "website",
          firstAppointmentDate: start,
          lastAppointmentDate: start,
          totalAppointments: 1,
        },
      });

  const confirmationNumber = generateConfirmationNumber();

  const appointment = await prisma.appointment.create({
    data: {
      confirmationNumber,
      type: data.appointmentType,
      status: "scheduled",
      paymentStatus: "unpaid",
      clientId: client.id,
      clientName: data.name,
      company: data.company || "",
      email: data.email,
      phone: data.phone,
      address: data.address || "",
      serviceType: data.serviceType,
      documentType: data.documentType,
      numberOfActs: data.numberOfActs,
      statutoryFeeCents,
      otherFeesCents: serviceFeeCents,
      totalAmountCents: totalCents,
      scheduledStart: start,
      scheduledEnd: end,
      notes: data.notes || "",
      source: "public_booking",
    },
  });

  await createNotification({
    type: "new_booking",
    title: "New appointment booked online",
    body: `${data.name} booked ${data.serviceType} for ${start.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`,
    link: `/admin/appointments/${appointment.id}`,
  });

  return {
    success: true,
    confirmationNumber,
    appointmentId: appointment.id,
    pricing: { statutoryFeeCents, serviceFeeCents, totalCents },
  };
}
