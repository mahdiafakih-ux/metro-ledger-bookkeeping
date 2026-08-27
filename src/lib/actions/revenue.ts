"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { dollarsToCents } from "@/lib/money";
import { MILESTONE_CENTS } from "@/lib/goal";
import { getTotalEarnedCents } from "@/lib/queries/dashboard";
import { createNotification } from "@/lib/actions/notifications";

export async function addManualRevenueEntry(input: { amountDollars: number; description: string; date: string }) {
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

export async function checkAndRecordMilestones(beforeCents: number, afterCents: number) {
  const crossed = MILESTONE_CENTS.filter((m) => beforeCents < m && afterCents >= m);
  for (const m of crossed) {
    await prisma.milestoneAchievement.upsert({
      where: { amountCents: m },
      update: {},
      create: { amountCents: m, seen: false },
    });
    await createNotification({
      type: "goal_milestone",
      title: `🎉 Milestone reached: $${(m / 100).toLocaleString()}`,
      body: "You're one step closer to your $50,000 goal!",
      link: "/admin/goal",
    });
  }
  return crossed;
}

export async function getUnseenMilestones() {
  const rows = await prisma.milestoneAchievement.findMany({ where: { seen: false } });
  return rows;
}

export async function markMilestonesSeen(ids: string[]) {
  await prisma.milestoneAchievement.updateMany({ where: { id: { in: ids } }, data: { seen: true } });
}
