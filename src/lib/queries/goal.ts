import { prisma } from "@/lib/db";

export async function getCumulativeRevenueSeries(months = 6) {
  const now = new Date();
  const startWindow = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const priorAgg = await prisma.revenueEntry.aggregate({
    where: { date: { lt: startWindow } },
    _sum: { amountCents: true },
  });

  const entries = await prisma.revenueEntry.findMany({
    where: { date: { gte: startWindow } },
    select: { date: true, amountCents: true },
  });

  const buckets: { key: string; label: string; monthCents: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("en-US", { month: "short" }), monthCents: 0 });
  }
  for (const e of entries) {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) bucket.monthCents += e.amountCents;
  }

  let running = priorAgg._sum.amountCents ?? 0;
  return buckets.map((b) => {
    running += b.monthCents;
    return { label: b.label, cumulativeCents: running };
  });
}
