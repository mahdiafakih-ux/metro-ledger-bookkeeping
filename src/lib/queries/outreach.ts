import { prisma } from "@/lib/db";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function getOutreachStreaks(dailyTarget: number) {
  const since = new Date();
  since.setDate(since.getDate() - 60);

  const logs = await prisma.outreachLog.findMany({
    where: { dateContacted: { gte: since } },
    select: { dateContacted: true },
  });

  const countsByDay = new Map<string, number>();
  for (const log of logs) {
    const key = startOfDay(log.dateContacted).toISOString().slice(0, 10);
    countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
  }

  // Walk backward from today for the current streak; scan the full window for the best streak.
  let current = 0;
  const today = startOfDay(new Date());
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = countsByDay.get(key) ?? 0;
    if (count >= dailyTarget && dailyTarget > 0) current++;
    else break;
  }

  let best = 0;
  let running = 0;
  for (let i = 59; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = countsByDay.get(key) ?? 0;
    if (count >= dailyTarget && dailyTarget > 0) {
      running++;
      best = Math.max(best, running);
    } else {
      running = 0;
    }
  }

  return { current, best };
}

export async function getRevenueGeneratedFromOutreachCents() {
  const entries = await prisma.revenueEntry.findMany({
    include: {
      appointment: { include: { client: true, business: true } },
      invoice: { include: { business: true } },
    },
  });

  let total = 0;
  for (const e of entries) {
    const fromClient = e.appointment?.client?.leadSource === "outreach";
    const fromApptBusiness = e.appointment?.business?.leadSource === "outreach";
    const fromInvoiceBusiness = e.invoice?.business?.leadSource === "outreach";
    if (fromClient || fromApptBusiness || fromInvoiceBusiness) total += e.amountCents;
  }
  return total;
}
