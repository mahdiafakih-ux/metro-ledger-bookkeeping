// Production wiring for runCreateAppointment: the real availability engine,
// pricing and the shared public-booking core.

import { prisma } from "@/lib/db";
import { getOpenSlotsForDate } from "@/lib/availability";
import { AI_OPERATOR_BOOKING_CHANNEL, SLOT_TAKEN_ERROR, createBooking, quoteIndividualBooking } from "@/lib/booking-core";
import type { CreateAppointmentDeps } from "@/lib/agent/create-appointment";

export const createAppointmentDeps: CreateAppointmentDeps = {
  getOpenSlots: (dateISO) => getOpenSlotsForDate(dateISO),
  quote: (numberOfActs) => quoteIndividualBooking(numberOfActs),
  findDuplicate: (email, start) =>
    prisma.appointment.findFirst({
      where: {
        isDemo: false,
        status: { not: "cancelled" },
        scheduledStart: start,
        email: { equals: email, mode: "insensitive" },
      },
      select: { id: true, confirmationNumber: true, clientName: true, serviceType: true, type: true, status: true, scheduledStart: true },
    }),
  createBooking: async (booking) => {
    const result = await createBooking(booking, AI_OPERATOR_BOOKING_CHANNEL);
    return { ...result, slotTaken: !result.success && result.error === SLOT_TAKEN_ERROR };
  },
};
