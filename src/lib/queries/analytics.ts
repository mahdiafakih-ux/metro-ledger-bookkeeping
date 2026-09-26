import { planDisplayName } from "@/lib/plans";
import { prisma } from "@/lib/db";

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

export async function getMonthlyAppointmentsSeries(months = 6) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const appts = await prisma.appointment.findMany({
    where: { scheduledStart: { gte: start }, status: { not: "cancelled" } },
    select: { scheduledStart: true },
  });
  const buckets: { key: string; label: string; count: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: monthKey(d), label: d.toLocaleDateString("en-US", { month: "short" }), count: 0 });
  }
  for (const a of appts) {
    const b = buckets.find((x) => x.key === monthKey(a.scheduledStart));
    if (b) b.count++;
  }
  return buckets;
}

export async function getNewClientsSeries(months = 6) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const clients = await prisma.client.findMany({ where: { createdAt: { gte: start } }, select: { createdAt: true } });
  const buckets: { key: string; label: string; count: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: monthKey(d), label: d.toLocaleDateString("en-US", { month: "short" }), count: 0 });
  }
  for (const c of clients) {
    const b = buckets.find((x) => x.key === monthKey(c.createdAt));
    if (b) b.count++;
  }
  return buckets;
}

export async function getRevenueByService() {
  const appts = await prisma.appointment.findMany({
    where: { status: "completed" },
    select: { serviceType: true, totalAmountCents: true },
  });
  const map = new Map<string, number>();
  for (const a of appts) map.set(a.serviceType, (map.get(a.serviceType) ?? 0) + a.totalAmountCents);
  return Array.from(map.entries()).map(([label, cents]) => ({ label, value: cents / 100 }));
}

export async function getRevenueByPricingPlan() {
  const businesses = await prisma.business.findMany({
    where: { status: "active" },
    select: { currentPlanKey: true, packageKey: true, monthlyRevenueCents: true },
  });

  const individualAgg = await prisma.appointment.aggregate({
    where: { status: "completed", businessId: null },
    _sum: { totalAmountCents: true },
  });

  const map = new Map<string, number>();
  map.set("Individual", (individualAgg._sum.totalAmountCents ?? 0) / 100);
  // Stripe-managed plan first, manually-assigned package second; discontinued
  // plans (Unlimited) keep their own label so historical revenue stays visible.
  for (const b of businesses) {
    const key = b.currentPlanKey || b.packageKey;
    const name = key ? planDisplayName(key) : "Other";
    map.set(name, (map.get(name) ?? 0) + (b.monthlyRevenueCents ?? 0) / 100);
  }
  return Array.from(map.entries()).map(([label, value]: any) => ({ label, value }));
}

export async function getRevenueByClient(limit = 8) {
  const clients = await prisma.client.findMany({
    where: { totalRevenueCents: { gt: 0 } },
    orderBy: { totalRevenueCents: "desc" },
    take: limit,
    select: { name: true, totalRevenueCents: true },
  });
  return clients.map((c: any) => ({ label: c.name, revenue: c.totalRevenueCents / 100 }));
}

export async function getRevenueByCompany(limit = 8) {
  const businesses = await prisma.business.findMany({
    where: { monthlyRevenueCents: { gt: 0 } },
    orderBy: { monthlyRevenueCents: "desc" },
    take: limit,
    select: { companyName: true, monthlyRevenueCents: true },
  });
  return businesses.map((b: any) => ({ label: b.companyName, revenue: b.monthlyRevenueCents / 100 }));
}

export async function getRecurringRevenueCents() {
  const agg = await prisma.business.aggregate({ where: { status: "active" }, _sum: { monthlyRevenueCents: true } });
  return agg._sum.monthlyRevenueCents ?? 0;
}

export async function getAverageAppointmentValueCents() {
  const agg = await prisma.appointment.aggregate({ where: { status: "completed" }, _avg: { totalAmountCents: true } });
  return Math.round(agg._avg.totalAmountCents ?? 0);
}

export async function getSalesConversion() {
  const [total, won] = await Promise.all([
    prisma.pipelineOpportunity.count(),
    prisma.pipelineOpportunity.count({ where: { stage: "won" } }),
  ]);
  return total > 0 ? (won / total) * 100 : 0;
}

export async function getClientAcquisitionCount(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return prisma.client.count({ where: { createdAt: { gte: since } } });
}
