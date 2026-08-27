import { prisma } from "@/lib/db";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface TrajectoryPoint {
  label: string;
  requiredCents: number;
  actualCents: number | null;
  projectedCents: number | null;
}

/**
 * Monthly-resolution data for the goal chart: the straight-line "required"
 * path from $0 at goalStartDate to the goal amount at goalDeadline, the
 * "actual" cumulative revenue up through today, and a "projected" path
 * continuing from today's actual value at the current daily pace.
 */
export async function getGoalTrajectorySeries(input: {
  goalAmountCents: number;
  goalStartDate: Date;
  goalDeadline: Date;
  now?: Date;
}): Promise<TrajectoryPoint[]> {
  const now = input.now ?? new Date();
  const { goalAmountCents, goalStartDate, goalDeadline } = input;

  const entries = await prisma.revenueEntry.findMany({
    where: { date: { gte: goalStartDate } },
    select: { date: true, amountCents: true },
    orderBy: { date: "asc" },
  });
  const priorAgg = await prisma.revenueEntry.aggregate({
    where: { date: { lt: goalStartDate } },
    _sum: { amountCents: true },
  });

  function cumulativeThrough(date: Date) {
    let sum = priorAgg._sum.amountCents ?? 0;
    for (const e of entries) {
      if (e.date <= date) sum += e.amountCents;
      else break;
    }
    return sum;
  }

  const totalDays = Math.max((goalDeadline.getTime() - goalStartDate.getTime()) / MS_PER_DAY, 1);
  const actualAtNow = cumulativeThrough(now);
  const daysElapsed = Math.max((now.getTime() - goalStartDate.getTime()) / MS_PER_DAY, 0.0001);
  const currentPaceCentsPerDay = actualAtNow / daysElapsed;

  // Build one point per month from start to deadline (inclusive), capped at ~24 points.
  const points: Date[] = [];
  const cursor = new Date(goalStartDate.getFullYear(), goalStartDate.getMonth(), 1);
  const end = new Date(goalDeadline.getFullYear(), goalDeadline.getMonth(), 1);
  let guard = 0;
  while (cursor <= end && guard < 36) {
    points.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
    guard++;
  }
  if (points.length === 0 || points[points.length - 1].getTime() !== end.getTime()) {
    points.push(end);
  }

  return points.map((d) => {
    const clampedDate = d < goalStartDate ? goalStartDate : d > goalDeadline ? goalDeadline : d;
    const daysFromStart = (clampedDate.getTime() - goalStartDate.getTime()) / MS_PER_DAY;
    const requiredCents = Math.round(goalAmountCents * Math.min(1, daysFromStart / totalDays));

    const isPast = clampedDate <= now;
    const actualCents = isPast ? cumulativeThrough(clampedDate) : null;

    let projectedCents: number | null = null;
    if (!isPast) {
      const daysFromNow = (clampedDate.getTime() - now.getTime()) / MS_PER_DAY;
      projectedCents = Math.round(actualAtNow + currentPaceCentsPerDay * daysFromNow);
    } else if (clampedDate.getTime() === now.getTime() || Math.abs(daysFromStart - (now.getTime() - goalStartDate.getTime()) / MS_PER_DAY) < 15) {
      // Anchor the projected line to today's actual value so it connects visually.
      projectedCents = actualAtNow;
    }

    return {
      label: clampedDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      requiredCents,
      actualCents,
      projectedCents,
    };
  });
}

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
