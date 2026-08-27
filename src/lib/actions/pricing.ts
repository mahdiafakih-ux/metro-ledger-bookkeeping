"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { dollarsToCents } from "@/lib/money";

export interface PricingPlanUpdateInput {
  name: string;
  statutoryFeeDollars: number;
  serviceFeeDollars: number;
  serviceFeeLabel: string;
  appointmentsIncluded: number | null;
  overageFeeDollars: number | null;
  description: string;
  highlight: boolean;
  isActive: boolean;
}

export async function updatePricingPlan(id: string, input: PricingPlanUpdateInput) {
  const statutoryFeeCents = dollarsToCents(input.statutoryFeeDollars);
  const serviceFeeCents = dollarsToCents(input.serviceFeeDollars);
  await prisma.pricingPlan.update({
    where: { id },
    data: {
      name: input.name,
      statutoryFeeCents,
      serviceFeeCents,
      serviceFeeLabel: input.serviceFeeLabel,
      totalCents: statutoryFeeCents + serviceFeeCents,
      appointmentsIncluded: input.appointmentsIncluded,
      overageFeeCents: input.overageFeeDollars !== null ? dollarsToCents(input.overageFeeDollars) : null,
      description: input.description,
      highlight: input.highlight,
      isActive: input.isActive,
    },
  });
  revalidatePath("/admin/settings");
  revalidatePath("/pricing");
  revalidatePath("/business-solutions");
  revalidatePath("/");
  return { success: true };
}
