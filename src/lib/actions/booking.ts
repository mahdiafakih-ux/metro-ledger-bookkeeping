"use server";

import { bookingSchema, type BookingInput } from "@/lib/validation";
import { getOpenSlotsForDate } from "@/lib/availability";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createBooking, PUBLIC_BOOKING_CHANNEL, type BookingResult } from "@/lib/booking-core";

export type { BookingResult } from "@/lib/booking-core";

export async function getAvailableSlotsAction(dateISO: string) {
  return getOpenSlotsForDate(dateISO);
}

export async function submitBooking(input: BookingInput): Promise<BookingResult> {
  const ip = await getClientIp();
  const { allowed } = rateLimit(`booking:${ip}`, 8, 60 * 60 * 1000);
  if (!allowed) return { success: false, error: "Too many booking attempts. Please try again in a bit, or call us directly." };

  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.data ? "Invalid input" : parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Shared with the private AI operator — see src/lib/booking-core.ts.
  return createBooking(parsed.data, PUBLIC_BOOKING_CHANNEL);
}
