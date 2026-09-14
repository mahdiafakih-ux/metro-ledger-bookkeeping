"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

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
    data: input.activeDays.map((day: any) => ({
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
  await prisma.blackoutDate.create({ data: { date: new Date(`${date}T00:00:00`), reason } });
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function removeBlackoutDate(id: string) {
  await prisma.blackoutDate.delete({ where: { id } });
  revalidatePath("/admin/settings");
  return { success: true };
}
