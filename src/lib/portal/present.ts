// Pure presentation helpers for the client portal (no DB access).
import { detroitTodayISO } from "@/lib/tz";

export type Tone = "neutral" | "blue" | "accent" | "green" | "amber" | "red";

export interface StatusView {
  label: string;
  tone: Tone;
}

type InvoiceLike = {
  status: string;
  dueDate: Date;
  taxCents: number;
  amountPaidCents: number;
  items: { amountCents: number }[];
};

export function invoiceTotals(inv: InvoiceLike) {
  const subtotal = inv.items.reduce((sum, i) => sum + i.amountCents, 0);
  const total = subtotal + inv.taxCents;
  const balance = Math.max(0, total - inv.amountPaidCents);
  return { subtotal, total, balance };
}

/** Statuses that represent money actually owed by the client. */
export const OPEN_INVOICE_STATUSES = ["sent", "overdue", "partially_paid"] as const;

/** Invoice due dates are calendar days (stored at UTC midnight). */
function isPastDue(dueDate: Date, now: Date) {
  return dueDate.toISOString().slice(0, 10) < detroitTodayISO(now);
}

export function invoiceStatus(inv: InvoiceLike, now = new Date()): StatusView {
  const { balance } = invoiceTotals(inv);
  switch (inv.status) {
    case "paid":
      return { label: "Paid", tone: "green" };
    case "cancelled":
      return { label: "Void", tone: "neutral" };
    case "refunded":
      return { label: "Refunded", tone: "neutral" };
    case "overdue":
      return { label: "Overdue", tone: "red" };
    case "partially_paid":
      return isPastDue(inv.dueDate, now) ? { label: "Overdue", tone: "red" } : { label: "Partially paid", tone: "amber" };
    case "sent":
      if (balance <= 0) return { label: "Paid", tone: "green" };
      return isPastDue(inv.dueDate, now) ? { label: "Overdue", tone: "red" } : { label: "Open", tone: "blue" };
    default:
      return { label: inv.status.replace(/_/g, " "), tone: "neutral" };
  }
}

export function appointmentStatus(a: { status: string; assignedNotaryId?: string | null }): StatusView {
  switch (a.status) {
    case "scheduled":
      return a.assignedNotaryId ? { label: "Notary assigned", tone: "accent" } : { label: "Scheduled", tone: "blue" };
    case "completed":
      return { label: "Completed", tone: "green" };
    case "cancelled":
      return { label: "Cancelled", tone: "neutral" };
    case "no_show":
      return { label: "Missed", tone: "amber" };
    default:
      return { label: a.status.replace(/_/g, " "), tone: "neutral" };
  }
}

export function paymentStatus(status: string): StatusView {
  switch (status) {
    case "succeeded":
      return { label: "Paid", tone: "green" };
    case "pending":
      return { label: "Pending", tone: "amber" };
    case "failed":
      return { label: "Failed", tone: "red" };
    case "refunded":
      return { label: "Refunded", tone: "neutral" };
    default:
      return { label: status, tone: "neutral" };
  }
}

export function subscriptionStatus(status: string): StatusView {
  switch (status) {
    case "":
    case "active":
    case "trialing":
      return { label: "Active", tone: "green" };
    case "past_due":
      return { label: "Past due", tone: "amber" };
    case "incomplete":
      return { label: "Incomplete", tone: "amber" };
    case "canceled":
      return { label: "Canceled", tone: "neutral" };
    default:
      return { label: status.replace(/_/g, " "), tone: "neutral" };
  }
}

const METHOD_LABELS: Record<string, string> = {
  stripe: "Card",
  card: "Card",
  cash: "Cash",
  check: "Check",
  ach: "Bank transfer",
  invoice: "Invoice",
  other: "Other",
};

export function paymentMethodLabel(method: string) {
  return METHOD_LABELS[method] ?? (method ? method.replace(/_/g, " ") : "—");
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0][0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "")).toUpperCase();
}

export function appointmentTypeLabel(type: string) {
  return type === "remote" ? "Remote / online" : "In person";
}
