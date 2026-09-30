// Voice-friendly input for the create_appointment operator action, normalised
// into the exact BookingInput the public booking wizard submits and then
// re-checked with the same `bookingSchema`. Pure — no DB access.

import { z } from "zod";
import { SERVICE_TYPES } from "@/lib/constants";
import { bookingSchema, type BookingInput } from "@/lib/validation";
import { detroitDateTimeToUtc, formatDetroitDate, formatDetroitTime, parseDateISO } from "@/lib/tz";

/** Spoken/alternate names accepted for the two appointment types the app supports. */
const APPOINTMENT_TYPE_ALIASES: Record<string, "in_person" | "remote"> = {
  in_person: "in_person",
  "in-person": "in_person",
  "in person": "in_person",
  mobile: "in_person",
  remote: "remote",
  online: "remote",
};

export const createAppointmentDataSchema = z.strictObject({
  clientName: z.string().trim().min(2, "clientName is required").max(200),
  email: z.string().trim().max(320),
  phone: z.string().trim().max(30),
  service: z.string().trim().min(1, "service is required").max(200),
  appointmentType: z.string().trim().min(1, "appointmentType is required").max(20),
  date: z.string().trim().min(1, "date is required").max(20),
  time: z.string().trim().min(1, "time is required").max(20),
  documentType: z.string().trim().min(1, "documentType is required").max(200),
  numberOfActs: z.number().int().min(1).max(20).optional().default(1),
  address: z.string().trim().max(500).optional().default(""),
  company: z.string().trim().max(200).optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
});

export type CreateAppointmentData = z.input<typeof createAppointmentDataSchema>;

/**
 * "14:30", "2:30 PM", "2:30pm", "2 pm", "9am" → "HH:MM" (24h, zero-padded,
 * matching the slot values from getOpenSlotsForDate). Null when unparseable.
 */
export function normalizeTime(raw: string): string | null {
  const s = raw.trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
  let m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (m) {
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h > 23 || min > 59) return null;
    return `${String(h).padStart(2, "0")}:${m[2]}`;
  }
  m = /^(\d{1,2})(?::(\d{2}))? ?(am|pm)$/.exec(s);
  if (m) {
    let h = Number(m[1]);
    const min = m[2] ? Number(m[2]) : 0;
    if (h < 1 || h > 12 || min > 59) return null;
    if (m[3] === "am" && h === 12) h = 0;
    if (m[3] === "pm" && h !== 12) h += 12;
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }
  return null;
}

/** Case-insensitive match to the public wizard's service list. */
export function matchService(raw: string): (typeof SERVICE_TYPES)[number] | null {
  const key = raw.trim().toLowerCase();
  return SERVICE_TYPES.find((s) => s.toLowerCase() === key) ?? null;
}

/** "Thursday, October 1 at 9:00 AM" in Detroit time. */
export function voiceDateTime(instant: Date) {
  return `${formatDetroitDate(instant, { weekday: "long", month: "long", year: undefined })} at ${formatDetroitTime(instant)}`;
}

/** bookingSchema field → the name the operator sends. */
const BOOKING_FIELD_NAMES: Record<string, string> = { name: "clientName", serviceType: "service" };

export type NormalizedBooking =
  | { ok: true; booking: BookingInput; start: Date }
  | { ok: false; error: string };

export function normalizeBookingData(data: unknown, now: Date = new Date()): NormalizedBooking {
  const p = createAppointmentDataSchema.safeParse(data);
  if (!p.success) {
    const issue = p.error.issues[0];
    return { ok: false, error: issue ? `${issue.path.length ? `${issue.path.join(".")}: ` : ""}${issue.message}` : "Invalid input" };
  }
  const d = p.data;

  const appointmentType = APPOINTMENT_TYPE_ALIASES[d.appointmentType.toLowerCase()];
  if (!appointmentType) return { ok: false, error: "appointmentType must be in_person (mobile) or remote (online)." };

  const service = matchService(d.service);
  if (!service) return { ok: false, error: `Unknown service. Use one of: ${SERVICE_TYPES.join(", ")}.` };

  if (!parseDateISO(d.date)) return { ok: false, error: "date must be YYYY-MM-DD." };
  const time = normalizeTime(d.time);
  if (!time) return { ok: false, error: "time must be like 14:30 or 2:30 PM." };

  // Same rule as the public wizard: a mobile appointment needs an address.
  if (appointmentType === "in_person" && d.address.length <= 3) {
    return { ok: false, error: "address is required for an in-person (mobile) appointment." };
  }

  const start = detroitDateTimeToUtc(d.date, time);
  if (!start) return { ok: false, error: "Invalid date or time." };
  if (start.getTime() <= now.getTime()) return { ok: false, error: "That date and time is in the past." };

  // Final gate: the exact schema the public booking flow enforces
  // (valid email, phone of 7+ characters, field lengths).
  const candidate: BookingInput = {
    appointmentType,
    serviceType: service,
    documentType: d.documentType,
    numberOfActs: d.numberOfActs,
    date: d.date,
    time,
    name: d.clientName,
    email: d.email,
    phone: d.phone,
    company: d.company,
    address: appointmentType === "in_person" ? d.address : "",
    notes: d.notes,
  };
  const checked = bookingSchema.safeParse(candidate);
  if (!checked.success) {
    const issue = checked.error.issues[0];
    const field = String(issue?.path[0] ?? "input");
    return { ok: false, error: issue ? `${BOOKING_FIELD_NAMES[field] ?? field}: ${issue.message}` : "Invalid input" };
  }
  return { ok: true, booking: checked.data, start };
}
