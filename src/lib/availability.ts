import { prisma } from "./db";
import type { Prisma, PrismaClient } from "@prisma/client";

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
  const settings = await db.businessSettings.findUnique({ where: { id: "default" } });
  if (!settings || settings.vacationMode) return [];

  const date = new Date(`${dateISO}T00:00:00`);
  const now = new Date();

  const minNoticeMs = settings.minNoticeHours * 60 * 60 * 1000;
  const maxAdvanceMs = settings.maxAdvanceDays * 24 * 60 * 60 * 1000;
  if (date.getTime() - now.getTime() > maxAdvanceMs) return [];
  if (date.getTime() < now.getTime() - 24 * 60 * 60 * 1000) return [];

  const dayStart = new Date(`${dateISO}T00:00:00`);
  const dayEnd = new Date(`${dateISO}T23:59:59`);

  const blackout = await db.blackoutDate.findFirst({ where: { date: { gte: dayStart, lt: dayEnd } } });
  if (blackout) return [];

  const dayOfWeek = date.getDay();
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
    ...existingAppointments.map((a: any) => ({ start: a.scheduledStart, end: a.scheduledEnd })),
    ...existingBlocks.map((b: any) => ({ start: b.startTime, end: b.endTime })),
  ];

  const slots: SlotOption[] = [];
  for (let t = startMin; t + duration <= endMin; t += duration + buffer) {
    const slotStart = new Date(date);
    slotStart.setMinutes(t);
    const slotEnd = new Date(slotStart.getTime() + duration * 60000);

    if (slotStart.getTime() < now.getTime() + minNoticeMs) continue;

    const overlaps = occupied.some((a: any) => {
      const bufferedStart = new Date(a.start.getTime() - buffer * 60000);
      const bufferedEnd = new Date(a.end.getTime() + buffer * 60000);
      return slotStart < bufferedEnd && slotEnd > bufferedStart;
    });
    if (overlaps) continue;

    slots.push({ value: `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`, label: minutesToLabel(t) });
  }

  return slots;
}
