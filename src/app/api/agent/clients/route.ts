// GET /api/agent/clients — client lookup for the private AI operator.
//
//   ?search=<name|company|email|phone>   (min 2 chars) — includes email/phone
//   ?leadStatus=<status>  ?followUpDue=true  ?owing=true   — list filters
//   ?limit=<1-25>  (default 10)
//
// Without `search`, contact details (email/phone) are omitted. Demo excluded.

import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAgentAuth } from "@/lib/agent/auth";
import { agentError, agentOk, dateOnlyISO, money, parseLimit, parseSearch, phoneDigits, truncate, when } from "@/lib/agent/respond";
import { mergeById, phoneMatches } from "@/lib/agent/search";
import { planDisplayName } from "@/lib/plans";
import { LEAD_STATUSES } from "@/lib/constants";
import { dateOnlyToUtc, detroitTodayISO } from "@/lib/tz";

const clientSelect = {
  id: true,
  name: true,
  company: true,
  email: true,
  phone: true,
  clientType: true,
  leadStatus: true,
  currentPackage: true,
  currentPlanKey: true,
  subscriptionStatus: true,
  nextBillingDate: true,
  totalAppointments: true,
  totalRevenueCents: true,
  amountOwedCents: true,
  followUpDate: true,
  lastAppointmentDate: true,
  notes: true,
} satisfies Prisma.ClientSelect;

type ClientRow = Prisma.ClientGetPayload<{ select: typeof clientSelect }>;

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

  const leadStatus = searchParams.get("leadStatus");
  if (leadStatus && !(LEAD_STATUSES as readonly string[]).includes(leadStatus)) {
    return agentError(`Invalid leadStatus. Use one of: ${LEAD_STATUSES.join(", ")}.`, 400);
  }
  const followUpDue = searchParams.get("followUpDue") === "true";
  const owing = searchParams.get("owing") === "true";

  const where: Prisma.ClientWhereInput = { isDemo: false };
  if (leadStatus) where.leadStatus = leadStatus;
  if (followUpDue) where.followUpDate = { lte: dateOnlyToUtc(detroitTodayISO())! };
  if (owing) where.amountOwedCents = { gt: 0 };

  try {
    let rows: ClientRow[];
    if (search) {
      const textMatches = await prisma.client.findMany({
        where: {
          ...where,
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { company: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
          ],
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
        select: clientSelect,
      });
      const digits = phoneDigits(search);
      let phoneRows: ClientRow[] = [];
      if (digits) {
        const candidates = await prisma.client.findMany({
          where: { ...where, phone: { contains: digits.slice(-4) } },
          take: 200,
          select: clientSelect,
        });
        phoneRows = candidates.filter((c) => phoneMatches(c.phone, digits));
      }
      rows = mergeById(limit, textMatches, phoneRows);
    } else {
      rows = await prisma.client.findMany({
        where,
        orderBy: followUpDue ? { followUpDate: "asc" } : { updatedAt: "desc" },
        take: limit,
        select: clientSelect,
      });
    }

    return agentOk({
      count: rows.length,
      search: search ?? null,
      clients: rows.map((c) => ({
        id: c.id,
        name: c.name,
        company: c.company || null,
        ...(search ? { email: c.email || null, phone: c.phone || null } : {}),
        clientType: c.clientType,
        leadStatus: c.leadStatus,
        currentPackage: c.currentPlanKey ? planDisplayName(c.currentPlanKey) : c.currentPackage || null,
        subscriptionStatus: c.subscriptionStatus || null,
        nextBillingDate: c.nextBillingDate ? when(c.nextBillingDate) : null,
        totalAppointments: c.totalAppointments,
        totalRevenue: money(c.totalRevenueCents),
        amountOwed: money(c.amountOwedCents),
        followUpDate: dateOnlyISO(c.followUpDate),
        lastAppointment: when(c.lastAppointmentDate),
        notes: truncate(c.notes),
      })),
    });
  } catch (error) {
    console.error("Agent clients API error:", error instanceof Error ? error.message : error);
    return agentError("Unable to search clients", 500);
  }
}
