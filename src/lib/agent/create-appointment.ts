// create_appointment for the private AI operator.
//
// Pure orchestration: DB access is injected (see create-appointment-deps.ts)
// so this logic is unit-testable.
//
// Flow (same rules as the public booking wizard):
//   1. Input already normalised + checked with bookingSchema (booking-input.ts).
//   2. Duplicate check — same email at the same start time, not cancelled.
//      A retried request returns the existing appointment instead of a second one.
//   3. Live availability via getOpenSlotsForDate (vacation, blackout, hours,
//      buffer, minimum notice, max advance, existing bookings, admin blocks).
//   4. confirmed !== true  → nothing is written; a read-back summary is returned.
//   5. confirmed === true  → createBooking(), the shared public-booking core,
//      which re-checks the slot inside a Serializable transaction.
//
// The appointment is created UNPAID. No card is charged and no checkout is
// started; the customer pays from the emailed confirmation link, the client
// portal, or in person — exactly like a website booking.

import type { SlotOption } from "@/lib/availability";
import type { BookingInput } from "@/lib/validation";
import type { BookingResult } from "@/lib/booking-core";
import { formatCents } from "@/lib/money";
import { voiceDateTime } from "@/lib/agent/booking-input";

export interface ExistingAppointment {
  id: string;
  confirmationNumber: string;
  clientName: string;
  serviceType: string;
  type: string;
  status: string;
  scheduledStart: Date;
}

export interface CreateAppointmentDeps {
  getOpenSlots(dateISO: string): Promise<SlotOption[]>;
  findDuplicate(email: string, start: Date): Promise<ExistingAppointment | null>;
  quote(numberOfActs: number): Promise<{ statutoryFeeCents: number; serviceFeeCents: number; totalCents: number }>;
  /** `slotTaken` is true when the transactional re-check found the slot gone. */
  createBooking(booking: BookingInput): Promise<BookingResult & { slotTaken?: boolean }>;
}

export type CreateAppointmentOutcome =
  | { kind: "needs_confirmation"; prompt: string; preview: Record<string, unknown> }
  | { kind: "created"; appointment: Record<string, unknown>; message: string }
  | { kind: "duplicate"; appointment: Record<string, unknown>; message: string }
  | { kind: "unavailable"; message: string; alternatives: string[] }
  | { kind: "failed"; message: string };

const typeLabel = (t: string) => (t === "remote" ? "remote (online)" : "in person (mobile)");

function describeExisting(a: ExistingAppointment) {
  return {
    appointmentId: a.id,
    confirmationNumber: a.confirmationNumber,
    clientName: a.clientName,
    service: a.serviceType,
    appointmentType: a.type,
    scheduledFor: voiceDateTime(a.scheduledStart),
    scheduledStart: a.scheduledStart.toISOString(),
    status: a.status,
  };
}

/** Up to three open times nearest the requested one, for the operator to offer. */
export function nearestAlternatives(slots: SlotOption[], requested: string, max = 3): string[] {
  const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
  const target = toMin(requested);
  return [...slots]
    .sort((a, b) => Math.abs(toMin(a.value) - target) - Math.abs(toMin(b.value) - target))
    .slice(0, max)
    .sort((a, b) => toMin(a.value) - toMin(b.value))
    .map((s) => s.label);
}

export async function runCreateAppointment(
  booking: BookingInput,
  start: Date,
  confirmed: boolean,
  deps: CreateAppointmentDeps
): Promise<CreateAppointmentOutcome> {
  const when = voiceDateTime(start);

  const existing = await deps.findDuplicate(booking.email, start);
  if (existing) {
    return {
      kind: "duplicate",
      appointment: describeExisting(existing),
      message: `${existing.clientName} is already booked for ${voiceDateTime(existing.scheduledStart)} (confirmation ${existing.confirmationNumber}). No new appointment was created.`,
    };
  }

  const slots = await deps.getOpenSlots(booking.date);
  if (!slots.some((s) => s.value === booking.time)) {
    const alternatives = nearestAlternatives(slots, booking.time);
    return {
      kind: "unavailable",
      alternatives,
      message:
        alternatives.length > 0
          ? `${when} is not available. Open times that day: ${alternatives.join(", ")}.`
          : `${when} is not available, and there are no open times that day.`,
    };
  }

  const price = await deps.quote(booking.numberOfActs);

  if (!confirmed) {
    const acts = booking.numberOfActs === 1 ? "1 notarial act" : `${booking.numberOfActs} notarial acts`;
    const where = booking.appointmentType === "in_person" ? ` at ${booking.address}` : "";
    return {
      kind: "needs_confirmation",
      prompt:
        `Book ${booking.name} for ${booking.serviceType} (${booking.documentType}, ${acts}), ` +
        `${typeLabel(booking.appointmentType)}${where}, on ${when}? ` +
        `Total ${formatCents(price.totalCents)}, unpaid — the client gets a confirmation email with a payment link.`,
      preview: {
        clientName: booking.name,
        service: booking.serviceType,
        documentType: booking.documentType,
        numberOfActs: booking.numberOfActs,
        appointmentType: booking.appointmentType,
        scheduledFor: when,
        date: booking.date,
        time: booking.time,
        address: booking.appointmentType === "in_person" ? booking.address : null,
        total: { cents: price.totalCents, formatted: formatCents(price.totalCents) },
        paymentStatus: "unpaid",
      },
    };
  }

  const result = await deps.createBooking(booking);
  if (!result.success || !result.appointmentId || !result.confirmationNumber) {
    if (result.slotTaken) {
      // A concurrent retry of this same request may have just won the slot.
      const raced = await deps.findDuplicate(booking.email, start);
      if (raced) {
        return {
          kind: "duplicate",
          appointment: describeExisting(raced),
          message: `${raced.clientName} is already booked for ${voiceDateTime(raced.scheduledStart)} (confirmation ${raced.confirmationNumber}). No new appointment was created.`,
        };
      }
      return { kind: "unavailable", alternatives: [], message: `${when} was just taken. Check availability and pick another time.` };
    }
    return { kind: "failed", message: result.error ?? "The appointment could not be created." };
  }

  return {
    kind: "created",
    message: `Booked ${booking.name} for ${booking.serviceType} on ${when}. Confirmation number ${result.confirmationNumber}.`,
    appointment: {
      appointmentId: result.appointmentId,
      confirmationNumber: result.confirmationNumber,
      clientName: booking.name,
      service: booking.serviceType,
      appointmentType: booking.appointmentType,
      scheduledFor: when,
      scheduledStart: start.toISOString(),
      status: "scheduled",
      paymentStatus: "unpaid",
      total: { cents: result.pricing?.totalCents ?? price.totalCents, formatted: formatCents(result.pricing?.totalCents ?? price.totalCents) },
      clientEmail: booking.email,
    },
  };
}
