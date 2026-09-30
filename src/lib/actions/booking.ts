"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { bookingSchema, type BookingInput } from "@/lib/validation";
import { generateConfirmationNumber } from "@/lib/utils";
import { getOpenSlotsForDate } from "@/lib/availability";
import { createNotification } from "@/lib/actions/notifications";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

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

const SLOT_TAKEN_ERROR = "That time slot is no longer available. Please choose another.";

export async function submitBooking(input: BookingInput): Promise<BookingResult> {
  const ip = await getClientIp();
  const { allowed } = rateLimit(`booking:${ip}`, 8, 60 * 60 * 1000);
  if (!allowed) return { success: false, error: "Too many booking attempts. Please try again in a bit, or call us directly." };

  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.data ? "Invalid input" : parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

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

  const confirmationNumber = generateConfirmationNumber();

  // Booking is wrapped in a Serializable transaction: the availability
  // re-check and the appointment insert happen atomically, so two customers
  // racing for the same slot can't both succeed — Postgres aborts one with
  // a serialization error, which we surface as "slot no longer available."
  // A single retry handles the (rare) case where OUR transaction is the one
  // Postgres aborts despite the slot still being genuinely free for us.
  let appointmentId: string | null = null;
  let clientId: string | null = null;

  for (let attempt = 0; attempt < 2 && !appointmentId; attempt++) {
    try {
      const result = await prisma.$transaction(
        async (tx: any) => {
          const openSlots = await getOpenSlotsForDate(data.date, tx);
          if (!openSlots.some((s) => s.value === data.time)) {
            throw new Error(SLOT_TAKEN_ERROR);
          }

          const existingClient = data.email ? await tx.client.findFirst({ where: { email: data.email } }) : null;
          const client = existingClient
            ? await tx.client.update({
                where: { id: existingClient.id },
                data: {
                  name: data.name,
                  phone: data.phone,
                  company: data.company || existingClient.company,
                  lastAppointmentDate: start,
                  totalAppointments: { increment: 1 },
                },
              })
            : await tx.client.create({
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

          const appointment = await tx.appointment.create({
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

          return { appointmentId: appointment.id, clientId: client.id };
        },
        { isolationLevel: "Serializable" as any }
      );
      appointmentId = result.appointmentId;
      clientId = result.clientId;
    } catch (err) {
      if (err instanceof Error && err.message === SLOT_TAKEN_ERROR) {
        return { success: false, error: SLOT_TAKEN_ERROR };
      }
      // Postgres serialization failures carry code 40001, which Prisma
      // itself wraps as its own P2034 ("write conflict or deadlock") — the
      // condition to retry, not a real error.
      const code = typeof err === "object" && err !== null && "code" in err ? (err as { code?: string }).code : undefined;
      const isSerializationFailure = code === "40001" || code === "P2034";
      if (!isSerializationFailure || attempt === 1) {
        console.error("Booking transaction failed:", err);
        return { success: false, error: "Something went wrong while booking. Please try again." };
      }
    }
  }

  if (!appointmentId || !clientId) {
    return { success: false, error: SLOT_TAKEN_ERROR };
  }

  await createNotification({
    type: "new_booking",
    title: "New appointment booked online",
    body: `${data.name} booked ${data.serviceType} for ${start.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`,
    link: `/admin/appointments/${appointmentId}`,
  });

  if (data.email) {
    const { sendBookingConfirmationEmail } = await import("@/lib/email");
    await sendBookingConfirmationEmail({
      to: data.email,
      name: data.name,
      appointmentId,
      confirmationNumber,
      serviceType: data.serviceType,
      type: data.appointmentType,
      scheduledStart: start,
      totalCents,
    });
  }

  // Notify the business owner of the new booking. The appointment above is
  // already committed — a failure here is logged and never affects the
  // customer's booking result.
  try {
    const { sendBookingNotificationEmail } = await import("@/lib/email");
    const result = await sendBookingNotificationEmail({
      appointmentId,
      confirmationNumber,
      name: data.name,
      email: data.email,
      phone: data.phone,
      serviceType: data.serviceType,
      type: data.appointmentType,
      scheduledStart: start,
      address: data.address,
      notes: data.notes,
    });
    if (!result.success) {
      console.error("Booking owner-notification email failed:", result.error);
    }
  } catch (err) {
    console.error("Booking owner-notification email threw:", err instanceof Error ? err.message : err);
  }

  return {
    success: true,
    confirmationNumber,
    appointmentId,
    pricing: { statutoryFeeCents, serviceFeeCents, totalCents },
  };
}
