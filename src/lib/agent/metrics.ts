// Read-only business metrics for the private AI operator API.
//
// Every query excludes demo records (isDemo = false) so the operator only
// ever reports real business. RevenueEntry is the source of truth for earned
// revenue — the same table the admin dashboard and goal tracker sum. Unpaid
// or projected appointment amounts are never counted as earned.

import { prisma } from "@/lib/db";
import { computeGoalStats } from "@/lib/goal";
import { INDIVIDUAL_PRICE_CENTS, getSubscriptionPlan, planDisplayName } from "@/lib/plans";
import { getBusinessSettings } from "@/lib/settings";
import { dateOnlyToUtc, detroitTodayISO, formatDetroitDate } from "@/lib/tz";
import { money } from "@/lib/agent/respond";
import { type DateRange, rangeFilter } from "@/lib/agent/periods";

export const OUTSTANDING_INVOICE_STATUSES = ["sent", "partially_paid", "overdue"] as const;

export async function earnedCents(range: DateRange): Promise<number> {
  const agg = await prisma.revenueEntry.aggregate({
    where: { isDemo: false, date: rangeFilter(range) },
    _sum: { amountCents: true },
  });
  return agg._sum.amountCents ?? 0;
}

export async function revenueBreakdown(range: DateRange) {
  const groups = await prisma.revenueEntry.groupBy({
    by: ["source"],
    where: { isDemo: false, date: rangeFilter(range) },
    _sum: { amountCents: true },
    _count: { _all: true },
  });
  return groups
    .map((g) => ({ source: g.source, entries: g._count._all, amount: money(g._sum.amountCents ?? 0) }))
    .sort((a, b) => b.amount.cents - a.amount.cents);
}

/** Average value of completed appointments (billed amount) and of paid appointment revenue. */
export async function appointmentValueStats() {
  const [completed, paidRevenue] = await Promise.all([
    prisma.appointment.aggregate({
      where: { isDemo: false, status: "completed" },
      _avg: { totalAmountCents: true },
      _count: { _all: true },
    }),
    prisma.revenueEntry.aggregate({
      where: { isDemo: false, source: "appointment" },
      _avg: { amountCents: true },
      _count: { _all: true },
    }),
  ]);
  return {
    completedAppointments: completed._count._all,
    averageCompletedAppointmentValue: money(completed._avg.totalAmountCents ?? 0),
    paidAppointmentRevenueEntries: paidRevenue._count._all,
    averagePaidAppointmentRevenue: money(paidRevenue._avg.amountCents ?? 0),
  };
}

/**
 * Recurring monthly revenue. `recurringMonthlyRevenue` matches the admin
 * analytics figure (sum of active businesses' monthly revenue). The
 * subscription figure is list price of active Stripe subscriptions, before
 * any overage.
 */
export async function recurringRevenue() {
  const [activeAgg, subscribed] = await Promise.all([
    prisma.business.aggregate({
      where: { isDemo: false, status: "active" },
      _sum: { monthlyRevenueCents: true },
      _count: { _all: true },
    }),
    prisma.business.findMany({
      where: { isDemo: false, subscriptionStatus: { in: ["active", "past_due"] } },
      select: { currentPlanKey: true, subscriptionStatus: true },
      take: 500,
    }),
  ]);

  const byPlan = new Map<string, number>();
  let subscriptionCents = 0;
  let pastDue = 0;
  for (const b of subscribed) {
    const plan = getSubscriptionPlan(b.currentPlanKey);
    if (b.subscriptionStatus === "past_due") pastDue++;
    if (b.subscriptionStatus === "active" && plan) subscriptionCents += plan.monthlyCents;
    const name = planDisplayName(b.currentPlanKey);
    byPlan.set(name, (byPlan.get(name) ?? 0) + 1);
  }

  return {
    recurringMonthlyRevenue: money(activeAgg._sum.monthlyRevenueCents ?? 0),
    activeBusinessClients: activeAgg._count._all,
    activeSubscriptionMonthlyListPrice: money(subscriptionCents),
    subscriptions: {
      active: subscribed.length - pastDue,
      pastDue,
      byPlan: Object.fromEntries(byPlan),
    },
  };
}

/** $50K goal progress using the same math as the admin goal tracker, demo excluded. */
export async function goalSummary(totalEarned: number) {
  const settings = await getBusinessSettings();
  const avg = await prisma.appointment.aggregate({
    where: { isDemo: false, status: "completed" },
    _avg: { totalAmountCents: true },
  });
  const s = computeGoalStats({
    goalAmountCents: settings.goalAmountCents,
    goalDeadline: settings.goalDeadline,
    goalStartDate: settings.goalStartDate,
    earnedCents: totalEarned,
    avgAppointmentCents: avg._avg.totalAmountCents || INDIVIDUAL_PRICE_CENTS,
  });
  return {
    goal: money(s.goalAmountCents),
    // Deadline is a calendar day stored at UTC midnight.
    deadline: settings.goalDeadline.toISOString().slice(0, 10),
    earned: money(s.earnedCents),
    remaining: money(s.remainingCents),
    percentComplete: Math.round(s.percentComplete * 10) / 10,
    daysRemaining: s.daysRemaining,
    paceStatus: s.paceStatus,
    monthlyTargetFromNow: money(s.monthlyTargetCents),
    weeklyTargetFromNow: money(s.weeklyTargetCents),
    projectedCompletionDate: s.projectedCompletionDate ? formatDetroitDate(s.projectedCompletionDate) : null,
    forecastAtDeadline: money(s.forecastedRevenueAtDeadlineCents),
    appointmentsNeeded: s.appointmentsNeeded,
    nextMilestone: s.nextMilestoneCents !== null ? money(s.nextMilestoneCents) : null,
  };
}

interface InvoiceWithMoney {
  taxCents: number;
  amountPaidCents: number;
  items: { amountCents: number }[];
}

/** Same total formula as src/lib/payments.ts: line items + tax. */
export function invoiceAmounts(inv: InvoiceWithMoney) {
  const subtotal = inv.items.reduce((sum, i) => sum + i.amountCents, 0);
  const total = subtotal + inv.taxCents;
  const outstanding = Math.max(total - inv.amountPaidCents, 0);
  return { subtotal, total, paid: inv.amountPaidCents, outstanding };
}

/**
 * Due dates are calendar days (UTC midnight). An invoice is past due once its
 * due date is before today's Detroit calendar date.
 */
export function isPastDue(status: string, dueDate: Date, now: Date = new Date()) {
  if (status === "overdue") return true;
  if (!(OUTSTANDING_INVOICE_STATUSES as readonly string[]).includes(status)) return false;
  return dueDate < dateOnlyToUtc(detroitTodayISO(now))!;
}

/** Count and dollar total of unpaid invoices (sent / partially paid / overdue). */
export async function outstandingInvoiceSummary(now: Date = new Date()) {
  const invoices = await prisma.invoice.findMany({
    where: { isDemo: false, status: { in: [...OUTSTANDING_INVOICE_STATUSES] } },
    select: { status: true, dueDate: true, taxCents: true, amountPaidCents: true, items: { select: { amountCents: true } } },
    take: 1000,
  });
  let outstandingCents = 0;
  let overdueCount = 0;
  let overdueCents = 0;
  for (const inv of invoices) {
    const { outstanding } = invoiceAmounts(inv);
    outstandingCents += outstanding;
    if (isPastDue(inv.status, inv.dueDate, now)) {
      overdueCount++;
      overdueCents += outstanding;
    }
  }
  return {
    count: invoices.length,
    amount: money(outstandingCents),
    overdueCount,
    overdueAmount: money(overdueCents),
  };
}
