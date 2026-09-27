import { prisma } from "@/lib/db";
import { planIneligibilityReason, type SubscriptionPlanKey } from "@/lib/plans";

/**
 * Server-side enforcement of plan eligibility caps (Business10: max 30
 * notarizations/month). Every path that starts or changes a business
 * subscription calls `checkPlanEligibility` — the UI hiding a button is
 * never the only guard.
 *
 * A business's monthly volume is the highest of everything we know:
 *  - expectedMonthlyVolume  (captured at inquiry / declared at checkout)
 *  - monthlyUsage           (admin-entered typical usage)
 *  - monthlyUsageCount      (metered notarizations this billing period)
 *  - a volume declared in the current request, if any
 * Taking the max means a customer can't pick Business10 by under-declaring
 * when we already know their volume is above the cap.
 */

/** Parse a customer-declared monthly volume from a request body. */
export function parseDeclaredVolume(raw: unknown): number | undefined {
  const n = typeof raw === "string" ? Number(raw) : raw;
  if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
  return Math.min(10_000, Math.max(0, Math.floor(n)));
}

export async function businessMonthlyVolume(businessId: string, declared?: number): Promise<number | null> {
  const b = await prisma.business.findUnique({
    where: { id: businessId },
    select: { expectedMonthlyVolume: true, monthlyUsage: true, monthlyUsageCount: true },
  });
  if (!b) return null;
  return Math.max(b.expectedMonthlyVolume, b.monthlyUsage, b.monthlyUsageCount, declared ?? 0);
}

export async function checkPlanEligibility(
  businessId: string,
  planKey: SubscriptionPlanKey,
  declared?: number
): Promise<{ ok: true; volume: number } | { ok: false; error: string }> {
  const volume = await businessMonthlyVolume(businessId, declared);
  if (volume == null) return { ok: false, error: "Business not found" };
  const reason = planIneligibilityReason(planKey, volume);
  if (reason) return { ok: false, error: reason };

  // Remember a higher declared volume so later plan changes see it too.
  if (declared != null && declared > 0) {
    await prisma.business.updateMany({
      where: { id: businessId, expectedMonthlyVolume: { lt: declared } },
      data: { expectedMonthlyVolume: declared },
    });
  }
  return { ok: true, volume };
}
