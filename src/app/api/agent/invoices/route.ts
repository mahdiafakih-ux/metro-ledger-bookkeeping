// GET /api/agent/invoices — invoice & payment lookup for the AI operator.
//
//   ?status=draft|sent|paid|partially_paid|overdue|cancelled|refunded
//          |outstanding (sent + partially_paid + overdue)
//          |past_due    (outstanding and past its due date)
//   ?search=<invoice number|client|company>   (min 2 chars)
//   ?limit=<1-50>  (default 10)
//
// Answers "who owes us money?", "what's overdue?", "did John pay?".
// Stripe IDs / payment links are never returned. Demo excluded.

import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAgentAuth } from "@/lib/agent/auth";
import { agentError, agentOk, dateOnlyISO, money, parseLimit, parseSearch, truncate } from "@/lib/agent/respond";
import { OUTSTANDING_INVOICE_STATUSES, invoiceAmounts, isPastDue, outstandingInvoiceSummary } from "@/lib/agent/metrics";
import { INVOICE_STATUSES } from "@/lib/constants";
import { dateOnlyToUtc, detroitTodayISO, formatDetroitDate } from "@/lib/tz";

const STATUS_FILTERS = [...INVOICE_STATUSES, "outstanding", "past_due"] as const;

export async function GET(request: NextRequest) {
  const denied = requireAgentAuth(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  if (status && !(STATUS_FILTERS as readonly string[]).includes(status)) {
    return agentError(`Invalid status. Use one of: ${STATUS_FILTERS.join(", ")}.`, 400);
  }
  const rawSearch = searchParams.get("search");
  const search = parseSearch(rawSearch);
  if (rawSearch !== null && rawSearch.trim() !== "" && !search) {
    return agentError("Search must be at least 2 characters.", 400);
  }
  const limit = parseLimit(searchParams.get("limit"), 10, 50);

  const where: Prisma.InvoiceWhereInput = { isDemo: false };
  if (status === "outstanding") {
    where.status = { in: [...OUTSTANDING_INVOICE_STATUSES] };
  } else if (status === "past_due") {
    where.OR = [
      { status: "overdue" },
      { status: { in: ["sent", "partially_paid"] }, dueDate: { lt: dateOnlyToUtc(detroitTodayISO())! } },
    ];
  } else if (status) {
    where.status = status;
  }
  if (search) {
    where.AND = [
      {
        OR: [
          { invoiceNumber: { contains: search, mode: "insensitive" } },
          { clientName: { contains: search, mode: "insensitive" } },
          { company: { contains: search, mode: "insensitive" } },
        ],
      },
    ];
  }

  try {
    const [invoices, totals] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: [{ dueDate: "asc" }, { issueDate: "desc" }],
        take: limit,
        select: {
          id: true,
          invoiceNumber: true,
          clientName: true,
          company: true,
          status: true,
          issueDate: true,
          dueDate: true,
          taxCents: true,
          amountPaidCents: true,
          notes: true,
          items: { select: { description: true, type: true, quantity: true, amountCents: true }, take: 10 },
          payments: {
            where: { status: "succeeded" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { paidAt: true, createdAt: true, method: true },
          },
        },
      }),
      outstandingInvoiceSummary(),
    ]);

    return agentOk({
      count: invoices.length,
      filters: { status: status ?? null, search: search ?? null },
      allOutstanding: totals,
      invoices: invoices.map((inv) => {
        const amounts = invoiceAmounts(inv);
        const lastPayment = inv.payments[0];
        const paymentState =
          inv.status === "paid" || (amounts.total > 0 && amounts.outstanding === 0)
            ? "paid"
            : amounts.paid > 0
              ? "partially_paid"
              : "unpaid";
        return {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          client: inv.clientName,
          company: inv.company || null,
          status: inv.status,
          pastDue: isPastDue(inv.status, inv.dueDate),
          issueDate: dateOnlyISO(inv.issueDate),
          dueDate: dateOnlyISO(inv.dueDate),
          subtotal: money(amounts.subtotal),
          total: money(amounts.total),
          amountPaid: money(amounts.paid),
          amountOutstanding: money(amounts.outstanding),
          paymentState,
          lastPayment: lastPayment
            ? { date: formatDetroitDate(lastPayment.paidAt ?? lastPayment.createdAt), method: lastPayment.method }
            : null,
          lineItems: inv.items.map((i) => ({
            description: truncate(i.description, 120),
            type: i.type,
            quantity: i.quantity,
            amount: money(i.amountCents),
          })),
          notes: truncate(inv.notes, 200) || null,
        };
      }),
    });
  } catch (error) {
    console.error("Agent invoices API error:", error instanceof Error ? error.message : error);
    return agentError("Unable to load invoices", 500);
  }
}
