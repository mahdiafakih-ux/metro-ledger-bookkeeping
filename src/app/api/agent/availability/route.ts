// GET /api/agent/availability?date=YYYY-MM-DD — open booking slots for a
// Detroit calendar day. Slots come straight from getOpenSlotsForDate, the
// same function the public booking flow uses; this route only adds *why* a
// day has no slots (vacation, blackout, closed weekday, notice window).

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getOpenSlotsForDate } from "@/lib/availability";
import { requireAgentAuth } from "@/lib/agent/auth";
import { agentError, agentOk } from "@/lib/agent/respond";
import { DAY_NAMES } from "@/lib/constants";
import { dateOnlyToUtc, detroitDayRange, detroitTodayISO, formatDetroitDate, parseDateISO, weekdayOfDateISO } from "@/lib/tz";

function label12(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${period}`;
}

export async function GET(request: NextRequest) {
  const denied = requireAgentAuth(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? detroitTodayISO();
  if (!parseDateISO(date)) return agentError("Invalid date. Use YYYY-MM-DD.", 400);

  try {
    const now = new Date();
    const weekday = weekdayOfDateISO(date);
    const { start: dayStart, end: dayEnd } = detroitDayRange(date);
    const blackoutStart = dateOnlyToUtc(date)!;

    const [slots, settings, rule, blackout] = await Promise.all([
      getOpenSlotsForDate(date),
      prisma.businessSettings.findUnique({
        where: { id: "default" },
        select: {
          vacationMode: true,
          vacationMessage: true,
          minNoticeHours: true,
          maxAdvanceDays: true,
          appointmentDurationMinutes: true,
          bufferMinutes: true,
        },
      }),
      prisma.availabilityRule.findFirst({ where: { dayOfWeek: weekday, isActive: true }, select: { startTime: true, endTime: true } }),
      prisma.blackoutDate.findFirst({
        where: { date: { gte: blackoutStart, lt: new Date(blackoutStart.getTime() + 86_400_000) } },
        select: { reason: true },
      }),
    ]);

    let closedReason: string | null = null;
    if (slots.length === 0) {
      if (!settings) closedReason = "Business settings are not configured.";
      else if (settings.vacationMode) closedReason = `Vacation mode is on.${settings.vacationMessage ? ` ${settings.vacationMessage}` : ""}`;
      else if (dayEnd.getTime() <= now.getTime()) closedReason = "That date is in the past.";
      else if (dayStart.getTime() - now.getTime() > settings.maxAdvanceDays * 86_400_000)
        closedReason = `Bookings open only ${settings.maxAdvanceDays} days in advance.`;
      else if (blackout) closedReason = `Blackout date${blackout.reason ? `: ${blackout.reason}` : ""}.`;
      else if (!rule) closedReason = `Closed on ${DAY_NAMES[weekday]}s.`;
      else closedReason = `Fully booked, or remaining times are inside the ${settings.minNoticeHours}-hour minimum notice.`;
    }

    return agentOk({
      date,
      dateLabel: formatDetroitDate(dayStart, { weekday: "long" }),
      timeZone: "America/Detroit",
      open: slots.length > 0,
      closedReason,
      businessHours: rule ? { start: label12(rule.startTime), end: label12(rule.endTime) } : null,
      appointmentMinutes: settings?.appointmentDurationMinutes ?? null,
      slotCount: slots.length,
      slots: slots.map((s) => ({ time: s.value, label: s.label })),
    });
  } catch (error) {
    console.error("Agent availability API error:", error instanceof Error ? error.message : error);
    return agentError("Unable to load availability", 500);
  }
}
