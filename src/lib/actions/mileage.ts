"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";

export interface MileageInput {
  date: string;
  startLocation: string;
  destination: string;
  purpose: string;
  miles: number;
  clientName: string;
}

export async function createMileageLog(input: MileageInput) {
  const session = await requireAdminSession();
  if (!session) return { success: false as const, error: "Unauthorized" };

  await prisma.mileageLog.create({
    data: {
      date: new Date(input.date),
      startLocation: input.startLocation,
      destination: input.destination,
      purpose: input.purpose,
      miles: input.miles,
      clientName: input.clientName,
    },
  });
  revalidatePath("/admin/mileage");
  return { success: true };
}

export async function deleteMileageLog(id: string) {
  const session = await requireAdminSession();
  if (!session) return { success: false as const, error: "Unauthorized" };

  await prisma.mileageLog.delete({ where: { id } });
  revalidatePath("/admin/mileage");
  return { success: true };
}
