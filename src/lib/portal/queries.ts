import { prisma } from "@/lib/db";
import { detroitMonthRange } from "@/lib/tz";
import {
  appointmentScope,
  invoiceScope,
  paymentScope,
  preferenceOwner,
  type PortalAccount,
} from "./account";
import { OPEN_INVOICE_STATUSES, invoiceTotals } from "./present";

const notarySelect = { id: true, displayName: true, photoUrl: true, isActive: true } as const;

export type NotarySummary = { id: string; displayName: string; photoUrl: string; isActive: boolean };

/** Appointments that haven't ended yet and aren't cancelled/completed. */
function upcomingWhere(account: PortalAccount, now: Date) {
  return { AND: [appointmentScope(account), { status: "scheduled", scheduledEnd: { gte: now } }] };
}

export async function getOutstanding(account: PortalAccount) {
  const invoices = await prisma.invoice.findMany({
    where: { AND: [invoiceScope(account), { status: { in: [...OPEN_INVOICE_STATUSES] } }] },
    include: { items: { select: { amountCents: true } } },
  });
  let balanceCents = 0;
  let count = 0;
  for (const inv of invoices) {
    const { balance } = invoiceTotals(inv);
    if (balance > 0) {
      balanceCents += balance;
      count += 1;
    }
  }
  return { balanceCents, count };
}

export interface PreferredNotaryView {
  preferenceId: string;
  isPrimary: boolean;
  notary: NotarySummary;
  lastAppointment: Date | null;
}

export async function getPreferredNotaries(account: PortalAccount): Promise<PreferredNotaryView[]> {
  const prefs = await prisma.preferredNotary.findMany({
    where: preferenceOwner(account),
    include: { notary: { select: notarySelect } },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });
  if (!prefs.length) return [];

  const last = await prisma.appointment.groupBy({
    by: ["assignedNotaryId"],
    where: {
      AND: [appointmentScope(account), { status: "completed", assignedNotaryId: { in: prefs.map((p) => p.notaryId) } }],
    },
    _max: { scheduledStart: true },
  });
  const lastBy = new Map(last.map((l) => [l.assignedNotaryId, l._max.scheduledStart]));

  return prefs.map((p) => ({
    preferenceId: p.id,
    isPrimary: p.isPrimary,
    notary: p.notary,
    lastAppointment: lastBy.get(p.notaryId) ?? null,
  }));
}

/** Notaries who completed appointments for this account (for "request again"). */
export async function getWorkedWithNotaries(account: PortalAccount): Promise<(NotarySummary & { lastAppointment: Date | null })[]> {
  const rows = await prisma.appointment.groupBy({
    by: ["assignedNotaryId"],
    where: { AND: [appointmentScope(account), { status: "completed", assignedNotaryId: { not: null } }] },
    _max: { scheduledStart: true },
  });
  const ids = rows.map((r) => r.assignedNotaryId!).filter(Boolean);
  if (!ids.length) return [];
  const notaries = await prisma.notary.findMany({ where: { id: { in: ids }, isActive: true }, select: notarySelect });
  const lastBy = new Map(rows.map((r) => [r.assignedNotaryId, r._max.scheduledStart]));
  return notaries
    .map((n) => ({ ...n, lastAppointment: lastBy.get(n.id) ?? null }))
    .sort((a, b) => (b.lastAppointment?.getTime() ?? 0) - (a.lastAppointment?.getTime() ?? 0));
}

export type ActivityKind = "scheduled" | "completed" | "invoice" | "payment" | "refund";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  at: Date;
  /** Date-only event (e.g. invoice issue date) — show without a time. */
  dateOnly?: boolean;
  href?: string;
}

/**
 * Recent activity derived from real records only. Events without a reliable
 * timestamp are omitted rather than guessed (e.g. appointments completed
 * before `completedAt` existed, or cancellations — whose time isn't stored).
 */
export async function getRecentActivity(account: PortalAccount, limit = 7): Promise<ActivityItem[]> {
  const [created, completed, invoices, payments] = await Promise.all([
    prisma.appointment.findMany({
      where: appointmentScope(account),
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, serviceType: true, scheduledStart: true, createdAt: true },
    }),
    prisma.appointment.findMany({
      where: { AND: [appointmentScope(account), { status: "completed", completedAt: { not: null } }] },
      orderBy: { completedAt: "desc" },
      take: limit,
      select: { id: true, serviceType: true, completedAt: true, assignedNotary: { select: { displayName: true } } },
    }),
    prisma.invoice.findMany({
      where: invoiceScope(account),
      orderBy: { issueDate: "desc" },
      take: limit,
      select: { id: true, invoiceNumber: true, issueDate: true },
    }),
    prisma.payment.findMany({
      where: { AND: [paymentScope(account), { status: { in: ["succeeded", "refunded"] } }] },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        amountCents: true,
        status: true,
        paidAt: true,
        createdAt: true,
        invoice: { select: { invoiceNumber: true } },
        appointment: { select: { confirmationNumber: true } },
      },
    }),
  ]);

  const items: ActivityItem[] = [
    ...created.map((a) => ({
      id: `s-${a.id}`,
      kind: "scheduled" as const,
      title: "Appointment scheduled",
      detail: a.serviceType,
      at: a.createdAt,
      href: `/portal/appointments/${a.id}`,
      meta: a.scheduledStart,
    })),
    ...completed.map((a) => ({
      id: `c-${a.id}`,
      kind: "completed" as const,
      title: "Appointment completed",
      detail: a.assignedNotary ? `${a.serviceType} · ${a.assignedNotary.displayName}` : a.serviceType,
      at: a.completedAt!,
      href: `/portal/appointments/${a.id}`,
    })),
    ...invoices.map((i) => ({
      id: `i-${i.id}`,
      kind: "invoice" as const,
      title: "Invoice issued",
      detail: `Invoice ${i.invoiceNumber}`,
      at: i.issueDate,
      dateOnly: true,
      href: `/invoice/${i.id}`,
    })),
    ...payments.map((p) => ({
      id: `p-${p.id}`,
      kind: p.status === "refunded" ? ("refund" as const) : ("payment" as const),
      title: p.status === "refunded" ? "Payment refunded" : "Payment received",
      detail: p.invoice
        ? `Invoice ${p.invoice.invoiceNumber}`
        : p.appointment
        ? `Appointment ${p.appointment.confirmationNumber}`
        : "Payment",
      at: p.paidAt ?? p.createdAt,
      href: "/portal/payments",
      amountCents: p.amountCents,
    })),
  ];

  return items
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, limit)
    .map(({ id, kind, title, detail, at, href, ...rest }) => ({ id, kind, title, detail, at, href, dateOnly: "dateOnly" in rest ? rest.dateOnly : undefined }));
}

export async function getDashboardData(account: PortalAccount) {
  const now = new Date();
  const month = detroitMonthRange(now);
  const scope = appointmentScope(account);

  const [upcoming, upcomingCount, completedCount, monthCount, outstanding, preferred, workedWith, activity] =
    await Promise.all([
      prisma.appointment.findMany({
        where: upcomingWhere(account, now),
        orderBy: { scheduledStart: "asc" },
        take: 4,
        include: {
          assignedNotary: { select: notarySelect },
          preferredNotary: { select: notarySelect },
        },
      }),
      prisma.appointment.count({ where: upcomingWhere(account, now) }),
      prisma.appointment.count({ where: { AND: [scope, { status: "completed" }] } }),
      prisma.appointment.count({
        where: { AND: [scope, { status: { not: "cancelled" }, scheduledStart: { gte: month.start, lt: month.end } }] },
      }),
      getOutstanding(account),
      getPreferredNotaries(account),
      getWorkedWithNotaries(account),
      getRecentActivity(account),
    ]);

  return {
    next: upcoming[0] ?? null,
    upcoming: upcoming.slice(1),
    upcomingCount,
    completedCount,
    monthCount,
    outstanding,
    preferred,
    workedWith,
    activity,
  };
}
