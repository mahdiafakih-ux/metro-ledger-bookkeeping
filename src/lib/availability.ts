import { prisma } from "./db";
import type { Prisma, PrismaClient } from "@prisma/client";
import {
  dateOnlyToUtc,
  detroitDateTimeToUtc,
  detroitDayRange,
  parseDateISO,
  weekdayOfDateISO,
} from "./tz";

type Db = PrismaClient | Prisma.TransactionClient;

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function minutesToLabel(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export interface SlotOption {
  value: string; // "HH:MM" 24h
  label: string; // "9:00 AM"
}

/**
 * Computes open booking slots for a date. Accepts an optional Prisma client
 * so callers can run this inside a transaction (see submitBooking) to close
 * the race window between "check availability" and "create appointment."
 */
export async function getOpenSlotsForDate(dateISO: string, db: Db = prisma): Promise<SlotOption[]> {
  // All scheduling is in America/Detroit regardless of the server's TZ
  // (Vercel runs in UTC). `dateISO` is a Detroit calendar date and each slot
  // time is Detroit wall-clock, converted to a UTC instant for comparison.
  if (!parseDateISO(dateISO)) return [];

  const settings = await db.businessSettings.findUnique({ where: { id: "default" } });
  if (!settings || settings.vacationMode) return [];

  const now = new Date();
  const { start: dayStart, end: dayEnd } = detroitDayRange(dateISO);

  const minNoticeMs = settings.minNoticeHours * 60 * 60 * 1000;
  const maxAdvanceMs = settings.maxAdvanceDays * 24 * 60 * 60 * 1000;
  if (dayStart.getTime() - now.getTime() > maxAdvanceMs) return [];
  if (dayEnd.getTime() <= now.getTime()) return [];

  // Blackout dates are calendar days stored at UTC midnight. Legacy rows
  // written with server-local midnight land within the same UTC day
  // (00:00Z on Vercel, 04:00–05:00Z from a Detroit machine), so a UTC-day
  // window matches both without touching existing data.
  const blackoutDayStart = dateOnlyToUtc(dateISO)!;
  const blackoutDayEnd = new Date(blackoutDayStart.getTime() + 24 * 60 * 60 * 1000);
  const blackout = await db.blackoutDate.findFirst({
    where: { date: { gte: blackoutDayStart, lt: blackoutDayEnd } },
  });
  if (blackout) return [];

  const dayOfWeek = weekdayOfDateISO(dateISO);
  const rule = await db.availabilityRule.findFirst({ where: { dayOfWeek, isActive: true } });
  if (!rule) return [];

  const duration = settings.appointmentDurationMinutes;
  const buffer = settings.bufferMinutes;
  const startMin = toMinutes(rule.startTime);
  const endMin = toMinutes(rule.endTime);

  const [existingAppointments, existingBlocks] = await Promise.all([
    db.appointment.findMany({
      where: { scheduledStart: { gte: dayStart, lt: dayEnd }, status: { not: "cancelled" } },
      select: { scheduledStart: true, scheduledEnd: true },
    }),
    db.adminBlock.findMany({
      where: { startTime: { lt: dayEnd }, endTime: { gt: dayStart } },
      select: { startTime: true, endTime: true },
    }),
  ]);
  const occupied = [
    ...existingAppointments.map((a) => ({ start: a.scheduledStart, end: a.scheduledEnd })),
    ...existingBlocks.map((b) => ({ start: b.startTime, end: b.endTime })),
  ];

  const slots: SlotOption[] = [];
  for (let t = startMin; t + duration <= endMin; t += duration + buffer) {
    const hhmm = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
    const slotStart = detroitDateTimeToUtc(dateISO, hhmm);
    if (!slotStart) continue;
    const slotEnd = new Date(slotStart.getTime() + duration * 60000);

    if (slotStart.getTime() < now.getTime() + minNoticeMs) continue;

    const overlaps = occupied.some((a) => {
      const bufferedStart = new Date(a.start.getTime() - buffer * 60000);
      const bufferedEnd = new Date(a.end.getTime() + buffer * 60000);
      return slotStart < bufferedEnd && slotEnd > bufferedStart;
    });
    if (overlaps) continue;

    slots.push({ value: hhmm, label: minutesToLabel(t) });
  }

  return slots;
}
