"use server";

import { prisma } from "@/lib/db";
import { dollarsToCents } from "@/lib/money";

export interface SetupInput {
  businessName: string;
  phone: string;
  email: string;
  serviceArea: string;
  activeDays: number[];
  startTime: string;
  endTime: string;
  goalAmountDollars: number;
  goalDeadline: string;
  startingRevenueDollars: number;
}

export async function completeSetup(input: SetupInput) {
  await prisma.businessSettings.update({
    where: { id: "default" },
    data: {
      businessName: input.businessName,
      phone: input.phone,
      email: input.email,
      serviceArea: input.serviceArea,
      goalAmountCents: dollarsToCents(input.goalAmountDollars),
      goalDeadline: new Date(input.goalDeadline),
      goalStartDate: new Date(),
      setupCompleted: true,
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

  if (input.startingRevenueDollars > 0) {
    await prisma.revenueEntry.create({
      data: {
        amountCents: dollarsToCents(input.startingRevenueDollars),
        source: "manual",
        description: "Starting revenue balance (entered during setup)",
      },
    });
  }

  return { success: true };
}
