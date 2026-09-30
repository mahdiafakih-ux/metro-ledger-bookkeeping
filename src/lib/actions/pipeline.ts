"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { dollarsToCents } from "@/lib/money";
import { createNotification } from "@/lib/actions/notifications";
import { requireAdminSession } from "@/lib/auth";

export interface OpportunityInput {
  businessName: string;
  contactName: string;
  category: string;
  stage: string;
  potentialMonthlyDollars: number;
  dealValueDollars: number;
  probability: number;
  nextAction: string;
  nextFollowUpDate?: string;
  contactAttempts: number;
  lostReason: string;
  expectedCloseDate?: string;
  notes: string;
  businessId?: string;
}

export async function createOpportunity(input: OpportunityInput) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const opp = await prisma.pipelineOpportunity.create({
    data: {
      businessName: input.businessName,
      contactName: input.contactName,
      category: input.category,
      stage: input.stage,
      potentialMonthlyCents: dollarsToCents(input.potentialMonthlyDollars),
      dealValueCents: dollarsToCents(input.dealValueDollars),
      probability: input.probability,
      nextAction: input.nextAction,
      nextFollowUpDate: input.nextFollowUpDate ? new Date(input.nextFollowUpDate) : null,
      contactAttempts: input.contactAttempts,
      lostReason: input.lostReason,
      expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : null,
      notes: input.notes,
      businessId: input.businessId || null,
    },
  });
  revalidatePath("/admin/pipeline");
  return { success: true, id: opp.id };
}

export async function updateOpportunity(id: string, input: OpportunityInput) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  await prisma.pipelineOpportunity.update({
    where: { id },
    data: {
      businessName: input.businessName,
      contactName: input.contactName,
      category: input.category,
      stage: input.stage,
      potentialMonthlyCents: dollarsToCents(input.potentialMonthlyDollars),
      dealValueCents: dollarsToCents(input.dealValueDollars),
      probability: input.probability,
      nextAction: input.nextAction,
      nextFollowUpDate: input.nextFollowUpDate ? new Date(input.nextFollowUpDate) : null,
      contactAttempts: input.contactAttempts,
      lostReason: input.lostReason,
      expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : null,
      notes: input.notes,
      businessId: input.businessId || null,
    },
  });
  revalidatePath("/admin/pipeline");
  return { success: true };
}

export async function updateOpportunityStage(id: string, stage: string, lostReason?: string) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const opp = await prisma.pipelineOpportunity.update({
    where: { id },
    data: { stage, ...(lostReason !== undefined ? { lostReason } : {}) },
  });
  if (stage === "won") {
    await createNotification({
      type: "new_booking",
      title: `🎉 Deal won: ${opp.businessName}`,
      body: `Potential ${(opp.potentialMonthlyCents / 100).toLocaleString()}/mo — move them into Businesses to start tracking.`,
      link: "/admin/pipeline",
    });
  }
  revalidatePath("/admin/pipeline");
  return { success: true };
}

export async function deleteOpportunity(id: string) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  await prisma.pipelineOpportunity.delete({ where: { id } });
  revalidatePath("/admin/pipeline");
  return { success: true };
}
