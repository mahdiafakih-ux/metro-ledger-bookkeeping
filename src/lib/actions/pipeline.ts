"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { dollarsToCents } from "@/lib/money";
import { createNotification } from "@/lib/actions/notifications";

export interface OpportunityInput {
  businessName: string;
  contactName: string;
  category: string;
  stage: string;
  potentialMonthlyDollars: number;
  probability: number;
  expectedCloseDate?: string;
  notes: string;
}

export async function createOpportunity(input: OpportunityInput) {
  const opp = await prisma.pipelineOpportunity.create({
    data: {
      businessName: input.businessName,
      contactName: input.contactName,
      category: input.category,
      stage: input.stage,
      potentialMonthlyCents: dollarsToCents(input.potentialMonthlyDollars),
      probability: input.probability,
      expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : null,
      notes: input.notes,
    },
  });
  revalidatePath("/admin/pipeline");
  return { success: true, id: opp.id };
}

export async function updateOpportunity(id: string, input: OpportunityInput) {
  await prisma.pipelineOpportunity.update({
    where: { id },
    data: {
      businessName: input.businessName,
      contactName: input.contactName,
      category: input.category,
      stage: input.stage,
      potentialMonthlyCents: dollarsToCents(input.potentialMonthlyDollars),
      probability: input.probability,
      expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : null,
      notes: input.notes,
    },
  });
  revalidatePath("/admin/pipeline");
  return { success: true };
}

export async function updateOpportunityStage(id: string, stage: string) {
  const opp = await prisma.pipelineOpportunity.update({ where: { id }, data: { stage } });
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
  await prisma.pipelineOpportunity.delete({ where: { id } });
  revalidatePath("/admin/pipeline");
  return { success: true };
}
