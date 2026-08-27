"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { dollarsToCents } from "@/lib/money";
import { getTotalEarnedCents } from "@/lib/queries/dashboard";
import { checkAndRecordMilestones } from "@/lib/milestones";
import { requireAdminSession } from "@/lib/auth";

export async function addManualRevenueEntry(input: { amountDollars: number; description: string; date: string }) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const amountCents = dollarsToCents(input.amountDollars);
  if (amountCents <= 0) return { success: false, error: "Amount must be greater than zero" };

  const beforeTotal = await getTotalEarnedCents();

  await prisma.revenueEntry.create({
    data: {
      amountCents,
      source: "manual",
      description: input.description || "Manual revenue entry",
      date: new Date(input.date),
    },
  });

  const afterTotal = beforeTotal + amountCents;
  await checkAndRecordMilestones(beforeTotal, afterTotal);

  revalidatePath("/admin/goal");
  revalidatePath("/admin");
  return { success: true };
}

export async function getUnseenMilestones() {
  const session = await requireAdminSession();
  if (!session) return [];

  const rows = await prisma.milestoneAchievement.findMany({ where: { seen: false } });
  return rows;
}

export async function markMilestonesSeen(ids: string[]) {
  const session = await requireAdminSession();
  if (!session) return;

  await prisma.milestoneAchievement.updateMany({ where: { id: { in: ids } }, data: { seen: true } });
}
