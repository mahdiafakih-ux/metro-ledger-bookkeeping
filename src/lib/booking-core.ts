// The single appointment-booking implementation, shared by the public booking
// wizard (submitBooking in src/lib/actions/booking.ts) and the private AI
// operator (create_appointment in /api/agent/actions).
//
// Deliberately NOT a "use server" module: exports here must never become
// browser-callable Server Actions. Callers are responsible for rate limiting
// and for validating input with `bookingSchema` first.

import { Prisma } from "@prisma/client";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import type { BookingInput } from "@/lib/validation";
import { generateConfirmationNumber } from "@/lib/utils";
import { getOpenSlotsForDate } from "@/lib/availability";
import { createNotification } from "@/lib/actions/notifications";
import { detroitDateTimeToUtc, formatDetroitDateTime } from "@/lib/tz";

export interface BookingResult {
  success: boolean;
  error?: string;
  confirmationNumber?: string;
  appointmentId?: string;
  pricing?: { statutoryFeeCents: number; serviceFeeCents: number; totalCents: number };
}

export const SLOT_TAKEN_ERROR = "That time slot is no longer available. Please choose another.";

export interface BookingChannel {
  /** Stored on Appointment.source. */
  source: "public_booking" | "ai_operator";
  /** Stored on Client.leadSource when this booking creates a new client. */
  newClientLeadSource: string;
  /** Title of the admin in-app notification. */
  notificationTitle: string;
  /**
   * Whether to ring the owner via the private AI operator. Off for bookings
   * the owner made through the operator — he is already on that call.
   */
  notifyOperator: boolean;
}

export const PUBLIC_BOOKING_CHANNEL: BookingChannel = {
  source: "public_booking",
  newClientLeadSource: "website",
  notificationTitle: "New appointment booked online",
  notifyOperator: true,
};

export const AI_OPERATOR_BOOKING_CHANNEL: BookingChannel = {
  source: "ai_operator",
  newClientLeadSource: "phone",
  notificationTitle: "New appointment booked by AI operator",
  notifyOperator: false,
};

/** Price of an individual booking — the same numbers the public wizard shows. */
export async function quoteIndividualBooking(numberOfActs: number) {
  const individualPlan = await prisma.pricingPlan.findUnique({ where: { key: "individual" } });
  const statutoryFeeCents = numberOfActs * (individualPlan?.statutoryFeeCents ?? 1000);
  const serviceFeeCents = individualPlan?.serviceFeeCents ?? 11500;
  return { statutoryFeeCents, serviceFeeCents, totalCents: statutoryFeeCents + serviceFeeCents };
}

/**
 * Create a booking from already-validated input. Creates an unpaid appointment
 * — no payment is taken here; the customer pays later from the confirmation
 * link, the client portal, or in person.
 */
export async function createBooking(data: BookingInput, channel: BookingChannel): Promise<BookingResult> {
  const { statutoryFeeCents, serviceFeeCents, totalCents } = await quoteIndividualBooking(data.numberOfActs);

  // The customer picked a Detroit wall-clock date/time.
  const start = detroitDateTimeToUtc(data.date, data.time);
  if (!start) return { success: false, error: "Please choose a valid date and time." };
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
        async (tx: Prisma.TransactionClient) => {
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
                  leadSource: channel.newClientLeadSource,
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
              source: channel.source,
            },
          });

          return { appointmentId: appointment.id, clientId: client.id };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
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
    title: channel.notificationTitle,
    body: `${data.name} booked ${data.serviceType} for ${formatDetroitDateTime(start, { year: undefined })}`,
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

  // Tell the owner's private AI operator about the booking. Scheduled with
  // after() so it runs once the customer's response is sent; the hook itself
  // never throws and is a no-op until Vapi owner calls are configured.
  if (channel.notifyOperator) {
    try {
      const committedAppointmentId = appointmentId;
      after(async () => {
        try {
          const { notifyOperatorOfBooking } = await import("@/lib/agent/booking-notification");
          await notifyOperatorOfBooking({
            appointmentId: committedAppointmentId,
            confirmationNumber,
            clientName: data.name,
            service: data.serviceType,
            appointmentType: data.appointmentType,
            scheduledStart: start,
            paymentStatus: "unpaid",
            totalCents,
            location: data.address || undefined,
          });
        } catch (err) {
          console.error("Operator booking hook failed:", err instanceof Error ? err.message : err);
        }
      });
    } catch (err) {
      console.error("Operator booking hook could not be scheduled:", err instanceof Error ? err.message : err);
    }
  }

  return {
    success: true,
    confirmationNumber,
    appointmentId,
    pricing: { statutoryFeeCents, serviceFeeCents, totalCents },
  };
}
