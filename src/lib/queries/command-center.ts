import { prisma } from "@/lib/db";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface PriorityAction {
  id: string;
  score: number;
  tone: "urgent" | "high" | "normal";
  title: string;
  subtitle: string;
  href: string;
}

function daysOverdue(date: Date, now: Date) {
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / MS_PER_DAY));
}

export interface OutstandingInvoicesSummary {
  count: number;
  totalCents: number;
}

export async function getOutstandingInvoicesSummary(): Promise<OutstandingInvoicesSummary> {
  const invoices = await prisma.invoice.findMany({
    where: { status: { in: ["sent", "overdue", "partially_paid"] } },
    include: { items: true },
  });
  let count = 0;
  let totalCents = 0;
  for (const inv of invoices) {
    const subtotal = inv.items.reduce((sum, i) => sum + i.amountCents, 0);
    const balance = subtotal + inv.taxCents - inv.amountPaidCents;
    if (balance > 0) {
      count++;
      totalCents += balance;
    }
  }
  return { count, totalCents };
}

/**
 * Pulls together every open signal in the system (overdue money, overdue
 * follow-ups, today's appointments, outreach gap, goal pace) and ranks them
 * so the highest-leverage next action surfaces first on the Command Center.
 */
export async function getPriorityActions(now = new Date()): Promise<PriorityAction[]> {
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + MS_PER_DAY - 1);

  const [overdueInvoices, overdueClients, overdueOpportunities, dueTodayOpportunities] = await Promise.all([
    prisma.invoice.findMany({
      where: { status: { in: ["sent", "overdue", "partially_paid"] }, dueDate: { lt: startOfDay } },
      include: { items: true },
    }),
    prisma.client.findMany({ where: { followUpDate: { lt: startOfDay } } }),
    prisma.pipelineOpportunity.findMany({
      where: { stage: { notIn: ["won", "lost"] }, nextFollowUpDate: { lt: startOfDay } },
    }),
    prisma.pipelineOpportunity.findMany({
      where: { stage: { notIn: ["won", "lost"] }, nextFollowUpDate: { gte: startOfDay, lte: endOfDay } },
    }),
  ]);

  const actions: PriorityAction[] = [];

  for (const inv of overdueInvoices) {
    const subtotal = inv.items.reduce((sum, i) => sum + i.amountCents, 0);
    const balance = subtotal + inv.taxCents - inv.amountPaidCents;
    if (balance <= 0) continue;
    const overdue = daysOverdue(inv.dueDate, now);
    actions.push({
      id: `invoice-${inv.id}`,
      score: 100 + overdue,
      tone: "urgent",
      title: `Collect on Invoice ${inv.invoiceNumber}`,
      subtitle: `${inv.clientName} — $${(balance / 100).toLocaleString()} balance, ${overdue} day${overdue === 1 ? "" : "s"} overdue`,
      href: `/admin/invoices/${inv.id}`,
    });
  }

  for (const c of overdueClients) {
    const overdue = c.followUpDate ? daysOverdue(c.followUpDate, now) : 0;
    actions.push({
      id: `client-${c.id}`,
      score: 90 + overdue,
      tone: "urgent",
      title: `Follow up with ${c.name}`,
      subtitle: `Overdue by ${overdue} day${overdue === 1 ? "" : "s"}`,
      href: `/admin/clients/${c.id}`,
    });
  }

  for (const o of overdueOpportunities) {
    const overdue = o.nextFollowUpDate ? daysOverdue(o.nextFollowUpDate, now) : 0;
    actions.push({
      id: `opp-${o.id}`,
      score: 90 + overdue,
      tone: "urgent",
      title: `Follow up with ${o.businessName}`,
      subtitle: `${o.nextAction || "Next step needed"} — overdue by ${overdue} day${overdue === 1 ? "" : "s"}`,
      href: `/admin/pipeline/${o.id}`,
    });
  }

  for (const o of dueTodayOpportunities) {
    actions.push({
      id: `opp-today-${o.id}`,
      score: 70,
      tone: "high",
      title: `Follow up with ${o.businessName} today`,
      subtitle: o.nextAction || "Next step needed",
      href: `/admin/pipeline/${o.id}`,
    });
  }

  return actions.sort((a, b) => b.score - a.score);
}
