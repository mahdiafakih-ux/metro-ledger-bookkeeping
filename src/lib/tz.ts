// Business timezone helpers — dependency-free (Intl only), DST-aware.
//
// STORAGE CONVENTION
//   • Appointment / block timestamps are stored as absolute UTC instants
//     (Postgres `timestamp(3)`, written by Prisma in UTC).
//   • Customer & admin input ("Sept 24 at 9:00 AM") is always interpreted as
//     America/Detroit wall-clock time and converted to a UTC instant here.
//   • Display always converts the instant back to America/Detroit.
//   • The server's own TZ (UTC on Vercel, local on a dev laptop) never
//     affects the result.
//
// Date-only values (blackout dates, follow-up dates) are a separate
// convention: they're calendar days, stored as UTC midnight of that day —
// see `dateOnlyToUtc` / `formatDateOnly`.

export const BUSINESS_TIME_ZONE = "America/Detroit";

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: BUSINESS_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  weekday: "short",
});

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export interface ZonedParts {
  year: number;
  month: number; // 1–12
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: number; // 0 = Sunday
}

/** Wall-clock components of an instant in America/Detroit. */
export function getZonedParts(instant: Date): ZonedParts {
  const out: Record<string, string> = {};
  for (const p of partsFormatter.formatToParts(instant)) out[p.type] = p.value;
  return {
    year: Number(out.year),
    month: Number(out.month),
    day: Number(out.day),
    hour: Number(out.hour) % 24,
    minute: Number(out.minute),
    second: Number(out.second),
    weekday: WEEKDAYS[out.weekday] ?? 0,
  };
}

/** Offset of America/Detroit from UTC at `instant`, in minutes (e.g. -240 in EDT). */
function offsetMinutesAt(instant: Date): number {
  const p = getZonedParts(instant);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(instant.getTime() / 1000) * 1000) / 60000);
}

/**
 * Convert an America/Detroit wall-clock time to a UTC instant.
 * Handles DST: in the spring-forward gap (2:00–2:59 AM, nonexistent) the
 * time is pushed forward an hour; in the fall-back overlap the earlier
 * (EDT) instant is chosen.
 */
export function zonedWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const off1 = offsetMinutesAt(new Date(guess));
  let t = guess - off1 * 60000;
  const off2 = offsetMinutesAt(new Date(t));
  if (off2 !== off1) {
    // Try the other offset; prefer a candidate that round-trips exactly.
    const t2 = guess - off2 * 60000;
    const p = getZonedParts(new Date(t2));
    if (p.hour === hour && p.minute === minute) t = t2;
  }
  // Fall-back overlap: prefer the earlier of two valid instants.
  const earlier = t - 60 * 60000;
  const pe = getZonedParts(new Date(earlier));
  if (pe.day === day && pe.hour === hour && pe.minute === minute) t = earlier;
  return new Date(t);
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{1,2}):(\d{2})$/;

/** Parse "YYYY-MM-DD". Returns null if malformed or not a real date. */
export function parseDateISO(dateISO: string): { year: number; month: number; day: number } | null {
  const m = DATE_RE.exec(dateISO);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return { year, month, day };
}

/** "2026-09-24" + "09:00" (Detroit wall time) → UTC instant. */
export function detroitDateTimeToUtc(dateISO: string, hhmm: string): Date | null {
  const d = parseDateISO(dateISO);
  const t = TIME_RE.exec(hhmm);
  if (!d || !t) return null;
  const hour = Number(t[1]);
  const minute = Number(t[2]);
  if (hour > 23 || minute > 59) return null;
  return zonedWallTimeToUtc(d.year, d.month, d.day, hour, minute);
}

/** HTML `datetime-local` value ("2026-09-24T09:00") in Detroit time → UTC instant. */
export function datetimeLocalToUtc(value: string): Date | null {
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return null;
  return detroitDateTimeToUtc(datePart, timePart.slice(0, 5));
}

/** UTC instant → `datetime-local` value in Detroit time. */
export function utcToDatetimeLocal(instant: Date): string {
  const p = getZonedParts(instant);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** Detroit calendar date ("YYYY-MM-DD") of an instant. */
export function toDetroitDateISO(instant: Date): string {
  const p = getZonedParts(instant);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Today's date in Detroit as "YYYY-MM-DD". */
export function detroitTodayISO(now: Date = new Date()): string {
  return toDetroitDateISO(now);
}

/** Add days to a "YYYY-MM-DD" calendar date. */
export function addDaysISO(dateISO: string, days: number): string {
  const d = parseDateISO(dateISO);
  if (!d) return dateISO;
  const dt = new Date(Date.UTC(d.year, d.month - 1, d.day + days));
  return dt.toISOString().slice(0, 10);
}

/** Day of week (0 = Sunday) of a calendar date — timezone-independent. */
export function weekdayOfDateISO(dateISO: string): number {
  const d = parseDateISO(dateISO);
  if (!d) return 0;
  return new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay();
}

/**
 * The UTC instants bounding a Detroit calendar day: [start, end).
 * DST days are 23 or 25 hours long — this handles that.
 */
export function detroitDayRange(dateISO: string): { start: Date; end: Date } {
  const d = parseDateISO(dateISO);
  if (!d) throw new Error(`Invalid date: ${dateISO}`);
  const next = parseDateISO(addDaysISO(dateISO, 1))!;
  return {
    start: zonedWallTimeToUtc(d.year, d.month, d.day, 0, 0),
    end: zonedWallTimeToUtc(next.year, next.month, next.day, 0, 0),
  };
}

/** Start of the current Detroit month, as a UTC instant, plus next month's start. */
export function detroitMonthRange(now: Date = new Date()): { start: Date; end: Date } {
  const p = getZonedParts(now);
  const nextMonth = p.month === 12 ? { y: p.year + 1, m: 1 } : { y: p.year, m: p.month + 1 };
  return {
    start: zonedWallTimeToUtc(p.year, p.month, 1),
    end: zonedWallTimeToUtc(nextMonth.y, nextMonth.m, 1),
  };
}

/**
 * Returns a Date whose *server-local* fields equal the Detroit wall-clock
 * fields of `instant`. Use only to feed date-fns grid/grouping helpers
 * (isSameDay, startOfWeek…) — convert back with `fromZonedWallDate`.
 */
export function toZonedWallDate(instant: Date): Date {
  const p = getZonedParts(instant);
  return new Date(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}

/** Inverse of `toZonedWallDate`. */
export function fromZonedWallDate(wall: Date): Date {
  return zonedWallTimeToUtc(
    wall.getFullYear(),
    wall.getMonth() + 1,
    wall.getDate(),
    wall.getHours(),
    wall.getMinutes()
  );
}

// ---------- Date-only values ----------

/** "YYYY-MM-DD" calendar date → UTC midnight of that date (storage convention). */
export function dateOnlyToUtc(dateISO: string): Date | null {
  const d = parseDateISO(dateISO);
  if (!d) return null;
  return new Date(Date.UTC(d.year, d.month - 1, d.day));
}

// ---------- Display ----------

function fmt(instant: Date | string, opts: Intl.DateTimeFormatOptions) {
  const d = typeof instant === "string" ? new Date(instant) : instant;
  return d.toLocaleString("en-US", { timeZone: BUSINESS_TIME_ZONE, ...opts });
}

/** "Sep 24, 2026" */
export function formatDetroitDate(instant: Date | string, opts: Intl.DateTimeFormatOptions = {}) {
  return fmt(instant, { month: "short", day: "numeric", year: "numeric", ...opts });
}

/** "9:00 AM" */
export function formatDetroitTime(instant: Date | string) {
  return fmt(instant, { hour: "numeric", minute: "2-digit" });
}

/** "Thu, Sep 24 · 9:00 AM" style, customizable. */
export function formatDetroitDateTime(instant: Date | string, opts: Intl.DateTimeFormatOptions = {}) {
  return fmt(instant, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...opts,
  });
}

/** "EDT" / "EST" for an instant — shown next to times so it's unambiguous. */
export function detroitZoneAbbrev(instant: Date | string = new Date()) {
  const d = typeof instant === "string" ? new Date(instant) : instant;
  const part = new Intl.DateTimeFormat("en-US", { timeZone: BUSINESS_TIME_ZONE, timeZoneName: "short" })
    .formatToParts(d)
    .find((p) => p.type === "timeZoneName");
  return part?.value ?? "ET";
}

/** Date-only values (stored as UTC midnight) — displayed without any shift. */
export function formatDateOnly(value: Date | string, opts: Intl.DateTimeFormatOptions = {}) {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric", ...opts });
}
