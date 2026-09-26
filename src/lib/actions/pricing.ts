"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { dollarsToCents } from "@/lib/money";
import { requireAdminSession } from "@/lib/auth";
import { STATUTORY_FEE_PER_ACT_CENTS, feeBreakdown, getSubscriptionPlan, isLegacyPlanKey } from "@/lib/plans";

export interface PricingPlanUpdateInput {
  name: string;
  statutoryFeeDollars: number;
  serviceFeeDollars: number;
  serviceFeeLabel: string;
  appointmentsIncluded: number | null;
  overageFeeDollars: number | null;
  description: string;
  features?: string[];
  highlight: boolean;
  isActive: boolean;
}

export async function updatePricingPlan(id: string, input: PricingPlanUpdateInput) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const existing = await prisma.pricingPlan.findUnique({ where: { id } });
  if (!existing) return { success: false, error: "Plan not found" };
  if (isLegacyPlanKey(existing.key)) {
    return { success: false, error: "Business Unlimited is discontinued and cannot be edited or re-activated." };
  }

  const features = Array.isArray(input.features)
    ? input.features.map((f) => String(f).trim().slice(0, 160)).filter(Boolean).slice(0, 12)
    : undefined;
  const copy = {
    name: String(input.name).trim().slice(0, 80) || existing.name,
    description: String(input.description).slice(0, 400),
    highlight: !!input.highlight,
    isActive: !!input.isActive,
    ...(features ? { features: JSON.stringify(features) } : {}),
  };

  // Subscription plans: numbers always come from the plan catalog (the same
  // source Stripe checkout and overage billing use). Only copy is editable.
  const sub = getSubscriptionPlan(existing.key);
  if (sub) {
    const b = feeBreakdown(sub);
    await prisma.pricingPlan.update({
      where: { id },
      data: {
        ...copy,
        serviceFeeLabel: String(input.serviceFeeLabel).slice(0, 120) || existing.serviceFeeLabel,
        billingPeriod: "monthly",
        statutoryFeeCents: STATUTORY_FEE_PER_ACT_CENTS,
        actsIncluded: sub.includedNotarizations,
        serviceFeeCents: b.serviceCents,
        totalCents: sub.monthlyCents,
        appointmentsIncluded: sub.includedNotarizations,
        overageFeeCents: sub.overagePerNotarizationCents,
      },
    });
  } else {
    // Individual / one-time plans remain fully editable. The statutory fee is
    // capped server-side at Michigan's $10/act limit.
    const statutoryFeeCents = Math.min(STATUTORY_FEE_PER_ACT_CENTS, Math.max(0, dollarsToCents(Number(input.statutoryFeeDollars) || 0)));
    const serviceFeeCents = Math.max(0, dollarsToCents(Number(input.serviceFeeDollars) || 0));
    await prisma.pricingPlan.update({
      where: { id },
      data: {
        ...copy,
        statutoryFeeCents,
        serviceFeeCents,
        serviceFeeLabel: String(input.serviceFeeLabel).slice(0, 120),
        totalCents: statutoryFeeCents + serviceFeeCents,
        appointmentsIncluded: input.appointmentsIncluded,
        overageFeeCents: input.overageFeeDollars !== null ? dollarsToCents(input.overageFeeDollars) : null,
      },
    });
  }
  revalidatePath("/admin/settings");
  revalidatePath("/pricing");
  revalidatePath("/business-solutions");
  revalidatePath("/");
  return { success: true };
}
