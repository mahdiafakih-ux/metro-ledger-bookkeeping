import { prisma } from "@/lib/db";
import { getBusinessUsageSummary, type UsageSummary } from "@/lib/subscriptions";
import { isLegacyPlanKey, isSubscriptionPlanKey, planDisplayName } from "@/lib/plans";

export interface PortalBusinessBilling {
  businessId: string;
  companyName: string;
  role: string;
  canManage: boolean;
  planKey: string;
  planName: string;
  isLegacyPlan: boolean;
  subscriptionStatus: string;
  hasActiveSubscription: boolean;
  hasStripeCustomer: boolean;
  nextBillingDate: Date | null;
  usage: UsageSummary | null;
}

/** Businesses a portal client belongs to, with plan + current-period usage. */
export async function getPortalBusinesses(clientId: string): Promise<PortalBusinessBilling[]> {
  const links = await prisma.businessClient.findMany({
    where: { clientId },
    include: { business: true },
    orderBy: { createdAt: "asc" },
  });
  return Promise.all(
    links.map(async ({ business: b, role }) => {
      const active = !!b.stripeSubscriptionId && ["active", "past_due", "incomplete"].includes(b.subscriptionStatus);
      return {
        businessId: b.id,
        companyName: b.companyName,
        role,
        canManage: role === "owner" || role === "admin",
        planKey: b.currentPlanKey,
        planName: planDisplayName(b.currentPlanKey || null),
        isLegacyPlan: isLegacyPlanKey(b.currentPlanKey),
        subscriptionStatus: b.subscriptionStatus,
        hasActiveSubscription: active,
        hasStripeCustomer: !!b.stripeCustomerId,
        nextBillingDate: b.nextBillingDate,
        usage: isSubscriptionPlanKey(b.currentPlanKey) ? await getBusinessUsageSummary(b.id) : null,
      };
    })
  );
}
