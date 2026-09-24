"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";
import { detroitDateTimeToUtc } from "@/lib/tz";

export async function createAdminBlock(input: { date: string; startTime: string; endTime: string; reason: string }) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  // Inputs are Detroit wall-clock times.
  const startTime = detroitDateTimeToUtc(input.date, input.startTime);
  const endTime = detroitDateTimeToUtc(input.date, input.endTime);
  if (!startTime || !endTime) return { success: false, error: "Invalid date or time" };

  if (endTime <= startTime) return { success: false, error: "End time must be after start time" };

  await prisma.adminBlock.create({ data: { startTime, endTime, reason: input.reason } });
  revalidatePath("/admin/calendar");
  return { success: true };
}

export async function deleteAdminBlock(id: string) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  await prisma.adminBlock.delete({ where: { id } });
  revalidatePath("/admin/calendar");
  return { success: true };
}
