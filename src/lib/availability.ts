import { prisma } from "./db";

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

export async function getOpenSlotsForDate(dateISO: string): Promise<SlotOption[]> {
  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  if (!settings || settings.vacationMode) return [];

  const date = new Date(`${dateISO}T00:00:00`);
  const now = new Date();

  const minNoticeMs = settings.minNoticeHours * 60 * 60 * 1000;
  const maxAdvanceMs = settings.maxAdvanceDays * 24 * 60 * 60 * 1000;
  if (date.getTime() - now.getTime() > maxAdvanceMs) return [];
  if (date.getTime() < now.getTime() - 24 * 60 * 60 * 1000) return [];

  const blackout = await prisma.blackoutDate.findFirst({
    where: {
      date: {
        gte: new Date(`${dateISO}T00:00:00`),
        lt: new Date(`${dateISO}T23:59:59`),
      },
    },
  });
  if (blackout) return [];

  const dayOfWeek = date.getDay();
  const rule = await prisma.availabilityRule.findFirst({ where: { dayOfWeek, isActive: true } });
  if (!rule) return [];

  const duration = settings.appointmentDurationMinutes;
  const buffer = settings.bufferMinutes;
  const startMin = toMinutes(rule.startTime);
  const endMin = toMinutes(rule.endTime);

  const existing = await prisma.appointment.findMany({
    where: {
      scheduledStart: { gte: new Date(`${dateISO}T00:00:00`), lt: new Date(`${dateISO}T23:59:59`) },
      status: { not: "cancelled" },
    },
    select: { scheduledStart: true, scheduledEnd: true },
  });

  const slots: SlotOption[] = [];
  for (let t = startMin; t + duration <= endMin; t += duration + buffer) {
    const slotStart = new Date(date);
    slotStart.setMinutes(t);
    const slotEnd = new Date(slotStart.getTime() + duration * 60000);

    if (slotStart.getTime() < now.getTime() + minNoticeMs) continue;

    const overlaps = existing.some((a) => {
      const bufferedStart = new Date(a.scheduledStart.getTime() - buffer * 60000);
      const bufferedEnd = new Date(a.scheduledEnd.getTime() + buffer * 60000);
      return slotStart < bufferedEnd && slotEnd > bufferedStart;
    });
    if (overlaps) continue;

    slots.push({ value: `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`, label: minutesToLabel(t) });
  }

  return slots;
}
