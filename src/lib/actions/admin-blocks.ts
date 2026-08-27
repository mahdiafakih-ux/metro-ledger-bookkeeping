"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";

export async function createAdminBlock(input: { date: string; startTime: string; endTime: string; reason: string }) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const [startH, startM] = input.startTime.split(":").map(Number);
  const [endH, endM] = input.endTime.split(":").map(Number);
  const startTime = new Date(`${input.date}T00:00:00`);
  startTime.setHours(startH, startM, 0, 0);
  const endTime = new Date(`${input.date}T00:00:00`);
  endTime.setHours(endH, endM, 0, 0);

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
