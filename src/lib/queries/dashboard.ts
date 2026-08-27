import { prisma } from "@/lib/db";
import { computeGoalStats } from "@/lib/goal";
import { getBusinessSettings } from "@/lib/settings";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfWeek(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function getTotalEarnedCents() {
  const agg = await prisma.revenueEntry.aggregate({ _sum: { amountCents: true } });
  return agg._sum.amountCents ?? 0;
}

export async function getDashboardStats() {
  const now = new Date();
  const settings = await getBusinessSettings();

  const [
    totalEarnedCents,
    revenueThisMonthAgg,
    revenueThisWeekAgg,
    appointmentsToday,
    appointmentsThisMonth,
    activeBusinessClients,
    newLeadsCount,
    followUpsDue,
    outstandingInvoices,
    upcomingAppointments,
    recentAppointments,
    avgAppointmentAgg,
  ] = await Promise.all([
    getTotalEarnedCents(),
    prisma.revenueEntry.aggregate({ where: { date: { gte: startOfMonth(now) } }, _sum: { amountCents: true } }),
    prisma.revenueEntry.aggregate({ where: { date: { gte: startOfWeek(now) } }, _sum: { amountCents: true } }),
    prisma.appointment.count({ where: { scheduledStart: { gte: startOfDay(now), lte: endOfDay(now) }, status: { not: "cancelled" } } }),
    prisma.appointment.count({ where: { scheduledStart: { gte: startOfMonth(now) } } }),
    prisma.business.count({ where: { status: "active" } }),
    prisma.client.count({ where: { leadStatus: { in: ["new_lead", "interested"] } } }),
    prisma.client.count({ where: { followUpDate: { lte: endOfDay(now) } } }),
    prisma.invoice.count({ where: { status: { in: ["sent", "overdue"] } } }),
    prisma.appointment.findMany({
      where: { scheduledStart: { gte: now }, status: "scheduled" },
      orderBy: { scheduledStart: "asc" },
      take: 6,
    }),
    prisma.appointment.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.appointment.aggregate({ where: { status: "completed" }, _avg: { totalAmountCents: true } }),
  ]);

  const goalStats = computeGoalStats({
    goalAmountCents: settings.goalAmountCents,
    goalDeadline: settings.goalDeadline,
    goalStartDate: settings.goalStartDate,
    earnedCents: totalEarnedCents,
    avgAppointmentCents: avgAppointmentAgg._avg.totalAmountCents || 12500,
  });

  return {
    settings,
    goalStats,
    revenueThisMonthCents: revenueThisMonthAgg._sum.amountCents ?? 0,
    revenueThisWeekCents: revenueThisWeekAgg._sum.amountCents ?? 0,
    appointmentsToday,
    appointmentsThisMonth,
    activeBusinessClients,
    newLeadsCount,
    followUpsDue,
    outstandingInvoices,
    upcomingAppointments,
    recentAppointments,
  };
}

export async function getMonthlyRevenueSeries(months = 6) {
  const now = new Date();
  const entries = await prisma.revenueEntry.findMany({
    where: { date: { gte: new Date(now.getFullYear(), now.getMonth() - (months - 1), 1) } },
    select: { date: true, amountCents: true },
  });

  const buckets: { key: string; label: string; revenueCents: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("en-US", { month: "short" }), revenueCents: 0 });
  }
  for (const e of entries) {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) bucket.revenueCents += e.amountCents;
  }
  return buckets;
}
