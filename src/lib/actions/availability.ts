"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";
import { dateOnlyToUtc } from "@/lib/tz";

export interface AvailabilityInput {
  activeDays: number[];
  startTime: string;
  endTime: string;
  appointmentDurationMinutes: number;
  bufferMinutes: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
  vacationMode: boolean;
  vacationMessage: string;
}

export async function saveAvailability(input: AvailabilityInput) {
  // SECURITY: Server Actions are publicly invocable — admin only.
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  await prisma.businessSettings.update({
    where: { id: "default" },
    data: {
      appointmentDurationMinutes: input.appointmentDurationMinutes,
      bufferMinutes: input.bufferMinutes,
      minNoticeHours: input.minNoticeHours,
      maxAdvanceDays: input.maxAdvanceDays,
      vacationMode: input.vacationMode,
      vacationMessage: input.vacationMessage,
    },
  });

  await prisma.availabilityRule.deleteMany({});
  await prisma.availabilityRule.createMany({
    data: input.activeDays.map((day) => ({
      dayOfWeek: day,
      startTime: input.startTime,
      endTime: input.endTime,
      isActive: true,
    })),
  });

  revalidatePath("/admin/settings");
  revalidatePath("/book");
  return { success: true };
}

export async function addBlackoutDate(date: string, reason: string) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  // Calendar day stored as UTC midnight (see src/lib/tz.ts).
  const day = dateOnlyToUtc(date);
  if (!day) return { success: false, error: "Invalid date" };
  await prisma.blackoutDate.create({ data: { date: day, reason } });
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function removeBlackoutDate(id: string) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  await prisma.blackoutDate.delete({ where: { id } });
  revalidatePath("/admin/settings");
  return { success: true };
}
