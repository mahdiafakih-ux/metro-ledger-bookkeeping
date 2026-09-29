// GET /api/agent/businesses — business account lookup for the AI operator.
//
//   ?search=<company|contact|email|phone>   (min 2 chars) — includes contact email/phone
//   ?status=lead|active|inactive  ?category=<category>  ?followUpDue=true
//   ?limit=<1-25>  (default 10)
//
// Billing-contact details and Stripe IDs are never returned. Demo excluded.

import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAgentAuth } from "@/lib/agent/auth";
import { agentError, agentOk, dateOnlyISO, money, parseLimit, parseSearch, phoneDigits, truncate, when } from "@/lib/agent/respond";
import { mergeById, phoneMatches } from "@/lib/agent/search";
import { BUSINESS_CATEGORIES } from "@/lib/constants";
import { getSubscriptionPlan, planDisplayName } from "@/lib/plans";
import { dateOnlyToUtc, detroitTodayISO } from "@/lib/tz";

const BUSINESS_STATUSES = ["lead", "active", "inactive"] as const;

const businessSelect = {
  id: true,
  companyName: true,
  category: true,
  contactName: true,
  email: true,
  phone: true,
  packageKey: true,
  currentPlanKey: true,
  status: true,
  monthlyUsage: true,
  monthlyUsageCount: true,
  monthlyRevenueCents: true,
  expectedMonthlyVolume: true,
  subscriptionStatus: true,
  nextBillingDate: true,
  currentPeriodEnd: true,
  followUpDate: true,
  contractStart: true,
  contractEndDate: true,
  renewalDate: true,
  customPricingNotes: true,
  notes: true,
} satisfies Prisma.BusinessSelect;

type BusinessRow = Prisma.BusinessGetPayload<{ select: typeof businessSelect }>;

export async function GET(request: NextRequest) {
  const denied = requireAgentAuth(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const rawSearch = searchParams.get("search");
  const search = parseSearch(rawSearch);
  if (rawSearch !== null && rawSearch.trim() !== "" && !search) {
    return agentError("Search must be at least 2 characters.", 400);
  }
  const limit = parseLimit(searchParams.get("limit"), 10, 25);

  const status = searchParams.get("status");
  if (status && !(BUSINESS_STATUSES as readonly string[]).includes(status)) {
    return agentError(`Invalid status. Use one of: ${BUSINESS_STATUSES.join(", ")}.`, 400);
  }
  const category = searchParams.get("category");
  if (category && !(BUSINESS_CATEGORIES as readonly string[]).includes(category)) {
    return agentError(`Invalid category. Use one of: ${BUSINESS_CATEGORIES.join(", ")}.`, 400);
  }
  const followUpDue = searchParams.get("followUpDue") === "true";

  const where: Prisma.BusinessWhereInput = { isDemo: false };
  if (status) where.status = status;
  if (category) where.category = category;
  if (followUpDue) where.followUpDate = { lte: dateOnlyToUtc(detroitTodayISO())! };

  try {
    let rows: BusinessRow[];
    if (search) {
      const textMatches = await prisma.business.findMany({
        where: {
          ...where,
          OR: [
            { companyName: { contains: search, mode: "insensitive" } },
            { contactName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
          ],
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
        select: businessSelect,
      });
      const digits = phoneDigits(search);
      let phoneRows: BusinessRow[] = [];
      if (digits) {
        const candidates = await prisma.business.findMany({
          where: { ...where, phone: { contains: digits.slice(-4) } },
          take: 200,
          select: businessSelect,
        });
        phoneRows = candidates.filter((b) => phoneMatches(b.phone, digits));
      }
      rows = mergeById(limit, textMatches, phoneRows);
    } else {
      rows = await prisma.business.findMany({
        where,
        orderBy: followUpDue ? { followUpDate: "asc" } : { updatedAt: "desc" },
        take: limit,
        select: businessSelect,
      });
    }

    return agentOk({
      count: rows.length,
      search: search ?? null,
      businesses: rows.map((b) => {
        const planKey = b.currentPlanKey || b.packageKey;
        const plan = getSubscriptionPlan(planKey);
        return {
          id: b.id,
          companyName: b.companyName,
          category: b.category,
          contactName: b.contactName || null,
          ...(search ? { email: b.email || null, phone: b.phone || null } : {}),
          plan: planKey ? planDisplayName(planKey) : null,
          status: b.status,
          subscriptionStatus: b.subscriptionStatus || null,
          usageThisPeriod: plan
            ? { used: b.monthlyUsageCount, included: plan.includedNotarizations, periodEnds: when(b.currentPeriodEnd) }
            : { used: b.monthlyUsageCount },
          monthlyUsage: b.monthlyUsage,
          monthlyRevenue: money(b.monthlyRevenueCents),
          expectedMonthlyVolume: b.expectedMonthlyVolume,
          nextBillingDate: when(b.nextBillingDate),
          followUpDate: dateOnlyISO(b.followUpDate),
          contract: {
            start: dateOnlyISO(b.contractStart),
            end: dateOnlyISO(b.contractEndDate),
            renewal: dateOnlyISO(b.renewalDate),
          },
          customPricingNotes: truncate(b.customPricingNotes, 300) || null,
          notes: truncate(b.notes),
        };
      }),
    });
  } catch (error) {
    console.error("Agent businesses API error:", error instanceof Error ? error.message : error);
    return agentError("Unable to search businesses", 500);
  }
}
