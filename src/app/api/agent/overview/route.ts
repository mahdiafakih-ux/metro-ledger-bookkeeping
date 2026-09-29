// GET /api/agent/overview — concise real-time business snapshot for the
// private AI operator. Demo data excluded. No client contact details.

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAgentAuth } from "@/lib/agent/auth";
import { agentError, agentOk, money, when } from "@/lib/agent/respond";
import { periodRange } from "@/lib/agent/periods";
import {
  appointmentValueStats,
  earnedCents,
  goalSummary,
  outstandingInvoiceSummary,
  recurringRevenue,
} from "@/lib/agent/metrics";
import { dateOnlyToUtc, detroitTodayISO, formatDetroitDate } from "@/lib/tz";

export async function GET(request: NextRequest) {
  const denied = requireAgentAuth(request);
  if (denied) return denied;

  try {
    const now = new Date();
    const today = periodRange("today", now);
    const week = periodRange("week", now);
    const month = periodRange("month", now);
    // Follow-up dates are calendar days stored at UTC midnight.
    const todayDateOnly = dateOnlyToUtc(detroitTodayISO(now))!;

    const [
      totalEarned,
      monthEarned,
      weekEarned,
      appointmentsToday,
      appointmentsThisMonth,
      newLeads,
      clientFollowUpsDue,
      businessFollowUpsDue,
      upcoming,
      recentRevenue,
      invoices,
      recurring,
      apptValues,
    ] = await Promise.all([
      earnedCents(periodRange("all", now)),
      earnedCents(month),
      earnedCents(week),
      prisma.appointment.count({
        where: { isDemo: false, status: { not: "cancelled" }, scheduledStart: { gte: today.start!, lt: today.end! } },
      }),
      prisma.appointment.count({
        where: { isDemo: false, status: { not: "cancelled" }, scheduledStart: { gte: month.start!, lt: month.end! } },
      }),
      prisma.client.count({ where: { isDemo: false, leadStatus: { in: ["new_lead", "interested"] } } }),
      prisma.client.count({ where: { isDemo: false, followUpDate: { lte: todayDateOnly } } }),
      prisma.business.count({ where: { isDemo: false, followUpDate: { lte: todayDateOnly } } }),
      prisma.appointment.findMany({
        where: { isDemo: false, status: "scheduled", scheduledStart: { gte: now } },
        orderBy: { scheduledStart: "asc" },
        take: 5,
        select: {
          id: true,
          confirmationNumber: true,
          clientName: true,
          company: true,
          type: true,
          serviceType: true,
          scheduledStart: true,
          paymentStatus: true,
        },
      }),
      prisma.revenueEntry.findMany({
        where: { isDemo: false },
        orderBy: { date: "desc" },
        take: 5,
        select: { date: true, amountCents: true, source: true, description: true },
      }),
      outstandingInvoiceSummary(now),
      recurringRevenue(),
      appointmentValueStats(),
    ]);

    const goal = await goalSummary(totalEarned);

    return agentOk({
      asOf: when(now),
      revenue: {
        totalEarned: money(totalEarned),
        thisMonth: money(monthEarned),
        thisWeek: money(weekEarned),
        note: "Earned revenue = recorded payments (RevenueEntry). Unpaid appointments are not counted.",
      },
      appointments: {
        today: appointmentsToday,
        thisMonth: appointmentsThisMonth,
        averageCompletedAppointmentValue: apptValues.averageCompletedAppointmentValue,
        upcoming: upcoming.map((a) => ({
          id: a.id,
          confirmationNumber: a.confirmationNumber,
          clientName: a.clientName,
          company: a.company || null,
          type: a.type,
          service: a.serviceType,
          scheduledStart: when(a.scheduledStart),
          paymentStatus: a.paymentStatus,
        })),
      },
      clients: {
        activeBusinessClients: recurring.activeBusinessClients,
        newLeads,
        followUpsDue: { clients: clientFollowUpsDue, businesses: businessFollowUpsDue },
      },
      invoices: {
        outstandingCount: invoices.count,
        outstandingAmount: invoices.amount,
        overdueCount: invoices.overdueCount,
        overdueAmount: invoices.overdueAmount,
      },
      recurring: {
        recurringMonthlyRevenue: recurring.recurringMonthlyRevenue,
        activeSubscriptions: recurring.subscriptions.active,
        pastDueSubscriptions: recurring.subscriptions.pastDue,
      },
      goal,
      recentRevenue: recentRevenue.map((r) => ({
        date: formatDetroitDate(r.date),
        amount: money(r.amountCents),
        source: r.source,
        description: r.description.slice(0, 120),
      })),
    });
  } catch (error) {
    console.error("Agent overview API error:", error instanceof Error ? error.message : error);
    return agentError("Unable to load the business overview", 500);
  }
}
