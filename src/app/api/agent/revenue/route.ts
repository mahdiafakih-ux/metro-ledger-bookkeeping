// GET /api/agent/revenue — earned revenue for spoken financial questions.
//
//   ?period=today|week|month|year|all   (default: month, Detroit calendar)
//   ?from=YYYY-MM-DD&to=YYYY-MM-DD       (inclusive; overrides period; max 400 days)
//
// RevenueEntry is the source of truth (same as the admin dashboard); unpaid
// or projected appointment amounts are never counted. Demo data excluded.

import type { NextRequest } from "next/server";
import { requireAgentAuth } from "@/lib/agent/auth";
import { agentError, agentOk, money, when } from "@/lib/agent/respond";
import { PERIODS, customRange, isPeriod, periodRange, type DateRange } from "@/lib/agent/periods";
import { appointmentValueStats, earnedCents, goalSummary, recurringRevenue, revenueBreakdown } from "@/lib/agent/metrics";

export async function GET(request: NextRequest) {
  const denied = requireAgentAuth(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const periodParam = searchParams.get("period");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let range: DateRange;
  if (from || to) {
    if (!from || !to) return agentError("Provide both 'from' and 'to' (YYYY-MM-DD).", 400);
    const r = customRange(from, to);
    if ("error" in r) return agentError(r.error, 400);
    range = r;
  } else {
    const period = periodParam ?? "month";
    if (!isPeriod(period)) return agentError(`Invalid period. Use one of: ${PERIODS.join(", ")}.`, 400);
    range = periodRange(period);
  }

  try {
    const [periodEarned, totalEarned, bySource, apptValues, recurring] = await Promise.all([
      earnedCents(range),
      earnedCents(periodRange("all")),
      revenueBreakdown(range),
      appointmentValueStats(),
      recurringRevenue(),
    ]);
    const goal = await goalSummary(totalEarned);

    return agentOk({
      period: {
        label: range.label,
        start: when(range.start),
        end: when(range.end),
      },
      earned: money(periodEarned),
      bySource,
      totalEarnedAllTime: money(totalEarned),
      ...apptValues,
      recurring,
      goal,
      note: "Earned revenue counts recorded payments only; refunds are recorded as negative entries.",
    });
  } catch (error) {
    console.error("Agent revenue API error:", error instanceof Error ? error.message : error);
    return agentError("Unable to load revenue", 500);
  }
}
