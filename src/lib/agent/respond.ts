// Shared response + formatting helpers for the private AI operator API.
// Responses stay small and flat so a voice assistant can reason over them.

import { NextResponse } from "next/server";
import { formatCents } from "@/lib/money";
import { formatDetroitDateTime } from "@/lib/tz";

export function agentOk<T extends Record<string, unknown>>(body: T, status = 200) {
  return NextResponse.json({ success: true, ...body }, { status, headers: { "Cache-Control": "no-store" } });
}

export function agentError(error: string, status: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ success: false, error, ...extra }, { status, headers: { "Cache-Control": "no-store" } });
}

/** Precise cents plus a speakable dollar string. */
export function money(cents: number) {
  const rounded = Math.round(cents);
  return { cents: rounded, formatted: formatCents(rounded) };
}

/** Parse a `limit` query param, clamped to [1, max]. */
export function parseLimit(raw: string | null, fallback: number, max: number): number {
  if (raw === null || raw.trim() === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), 1), max);
}

/** Trim free text so a single long note can't bloat a response. */
export function truncate(text: string | null | undefined, max = 400): string {
  const t = (text ?? "").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/** Date-only values (stored as UTC midnight) → "YYYY-MM-DD", or null. */
export function dateOnlyISO(value: Date | null | undefined): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

/** Instant → ISO string plus a Detroit-time label for speaking. */
export function when(value: Date | null | undefined) {
  if (!value) return null;
  return { iso: value.toISOString(), detroit: formatDetroitDateTime(value, { weekday: "short" }) };
}

/** Normalise a search query; returns null when missing/too short. */
export function parseSearch(raw: string | null): string | null {
  const s = (raw ?? "").trim().slice(0, 100);
  return s.length >= 2 ? s : null;
}

/** Digits of a phone-like search, when it has enough to be meaningful. */
export function phoneDigits(search: string): string | null {
  const digits = search.replace(/\D/g, "");
  return digits.length >= 4 && digits.length >= search.replace(/\s/g, "").length - 4 ? digits : null;
}
