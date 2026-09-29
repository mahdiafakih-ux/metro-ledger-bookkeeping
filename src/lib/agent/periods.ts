// America/Detroit period ranges for the operator API. Pure functions — no DB.

import { addDaysISO, detroitDayRange, detroitTodayISO, parseDateISO, weekdayOfDateISO, zonedWallTimeToUtc } from "@/lib/tz";

export const PERIODS = ["today", "week", "month", "year", "all"] as const;
export type Period = (typeof PERIODS)[number];

export interface DateRange {
  label: string;
  /** Inclusive start instant, or null for "all time". */
  start: Date | null;
  /** Exclusive end instant, or null for "open-ended". */
  end: Date | null;
}

export function isPeriod(value: unknown): value is Period {
  return typeof value === "string" && (PERIODS as readonly string[]).includes(value);
}

/**
 * Range for a named period in Detroit calendar terms. Weeks start on Sunday,
 * matching the admin dashboard's "Revenue This Week".
 */
export function periodRange(period: Period, now: Date = new Date()): DateRange {
  const today = detroitTodayISO(now);
  const t = parseDateISO(today)!;
  switch (period) {
    case "today":
      return { label: "today", ...detroitDayRange(today) };
    case "week": {
      const weekStart = addDaysISO(today, -weekdayOfDateISO(today));
      return {
        label: "this week",
        start: detroitDayRange(weekStart).start,
        end: detroitDayRange(addDaysISO(weekStart, 7)).start,
      };
    }
    case "month": {
      const next = t.month === 12 ? { y: t.year + 1, m: 1 } : { y: t.year, m: t.month + 1 };
      return { label: "this month", start: zonedWallTimeToUtc(t.year, t.month, 1), end: zonedWallTimeToUtc(next.y, next.m, 1) };
    }
    case "year":
      return { label: "this year", start: zonedWallTimeToUtc(t.year, 1, 1), end: zonedWallTimeToUtc(t.year + 1, 1, 1) };
    case "all":
      return { label: "all time", start: null, end: null };
  }
}

export const MAX_CUSTOM_RANGE_DAYS = 400;

/**
 * Custom inclusive calendar range "from"–"to" (YYYY-MM-DD, Detroit days).
 * Returns an error string when invalid.
 */
export function customRange(from: string, to: string): DateRange | { error: string } {
  if (!parseDateISO(from) || !parseDateISO(to)) return { error: "Invalid from/to. Use YYYY-MM-DD." };
  const start = detroitDayRange(from).start;
  const end = detroitDayRange(to).end;
  if (end <= start) return { error: "'to' must be on or after 'from'." };
  if (end.getTime() - start.getTime() > (MAX_CUSTOM_RANGE_DAYS + 1) * 86_400_000) {
    return { error: `Date range cannot exceed ${MAX_CUSTOM_RANGE_DAYS} days.` };
  }
  return { label: `${from} to ${to}`, start, end };
}

/** Prisma `where` fragment for a DateTime column within a range. */
export function rangeFilter(range: DateRange): { gte?: Date; lt?: Date } | undefined {
  if (!range.start && !range.end) return undefined;
  return { ...(range.start ? { gte: range.start } : {}), ...(range.end ? { lt: range.end } : {}) };
}
