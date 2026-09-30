"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { dollarsToCents } from "@/lib/money";
import { requireAdminSession } from "@/lib/auth";

export interface ScorecardInput {
  businessesContacted: number;
  calls: number;
  emails: number;
  followUps: number;
  socialPostDone: boolean;
  appointmentsCompleted: number;
  revenueDollars: number;
  leadsGenerated: number;
}

function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function saveTodayScorecard(input: ScorecardInput) {
  const session = await requireAdminSession();
  if (!session) return { success: false as const, error: "Unauthorized" };

  const date = today();
  await prisma.scorecardEntry.upsert({
    where: { date },
    update: {
      businessesContacted: input.businessesContacted,
      calls: input.calls,
      emails: input.emails,
      followUps: input.followUps,
      socialPostDone: input.socialPostDone,
      appointmentsCompleted: input.appointmentsCompleted,
      revenueCents: dollarsToCents(input.revenueDollars),
      leadsGenerated: input.leadsGenerated,
    },
    create: {
      date,
      businessesContacted: input.businessesContacted,
      calls: input.calls,
      emails: input.emails,
      followUps: input.followUps,
      socialPostDone: input.socialPostDone,
      appointmentsCompleted: input.appointmentsCompleted,
      revenueCents: dollarsToCents(input.revenueDollars),
      leadsGenerated: input.leadsGenerated,
    },
  });
  revalidatePath("/admin/scorecard");
  revalidatePath("/admin/command-center");
  return { success: true };
}

export async function saveScorecardTargets(input: { targetBusinessesContacted: number; targetCalls: number; targetEmails: number; targetFollowUps: number }) {
  const session = await requireAdminSession();
  if (!session) return { success: false as const, error: "Unauthorized" };

  await prisma.businessSettings.update({ where: { id: "default" }, data: input });
  revalidatePath("/admin/scorecard");
  return { success: true };
}
