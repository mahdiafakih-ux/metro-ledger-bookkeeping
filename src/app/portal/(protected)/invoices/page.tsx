import Link from "next/link";
import { Download, ExternalLink, FileText } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getPortalAccount, invoiceScope } from "@/lib/portal/account";
import { getOutstanding } from "@/lib/portal/queries";
import { OPEN_INVOICE_STATUSES, invoiceStatus, invoiceTotals } from "@/lib/portal/present";
import { formatCents } from "@/lib/money";
import { formatDateOnly } from "@/lib/tz";
import { EmptyState, PageHeader, Panel, StatusPill } from "@/components/portal/ui";
import { cn } from "@/lib/utils";

export const metadata = { title: "Invoices" };

type Filter = "all" | "open" | "paid";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "paid", label: "Paid" },
];

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const sp = await searchParams;
  const filter: Filter = (FILTERS.find((f) => f.key === sp.filter)?.key ?? "all") as Filter;
  const account = await getPortalAccount();

  const statusWhere: Prisma.InvoiceWhereInput =
    filter === "open" ? { status: { in: [...OPEN_INVOICE_STATUSES] } } : filter === "paid" ? { status: "paid" } : {};

  const [invoices, outstanding] = await Promise.all([
    prisma.invoice.findMany({
      where: { AND: [invoiceScope(account), statusWhere] },
      include: { items: { select: { amountCents: true } } },
      orderBy: { issueDate: "desc" },
      take: 100,
    }),
    getOutstanding(account),
  ]);

  return (
    <div className="portal-enter space-y-6">
      <PageHeader
        title="Invoices"
        description={
          outstanding.balanceCents > 0 ? (
            <>
              <span className="tabular font-semibold text-navy-900">{formatCents(outstanding.balanceCents)}</span> outstanding across{" "}
              {outstanding.count} invoice{outstanding.count === 1 ? "" : "s"}.
            </>
          ) : (
            "You're all caught up — nothing is due."
          )
        }
      />

      <div className="flex gap-1" role="group" aria-label="Filter invoices">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/portal/invoices" : `/portal/invoices?filter=${f.key}`}
            aria-current={f.key === filter ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
              f.key === filter ? "bg-navy-900 text-white" : "bg-white text-navy-600 ring-1 ring-inset ring-navy-200 hover:text-navy-900"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Panel className="overflow-hidden">
        {invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={filter === "open" ? "You're all caught up." : "No invoices yet"}
            description={filter === "open" ? "No open invoices right now." : "Invoices will appear here once they're generated."}
          />
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full text-sm md:table">
              <caption className="sr-only">Invoices</caption>
              <thead>
                <tr className="border-b border-navy-100 text-left text-xs font-medium text-navy-400">
                  <th scope="col" className="px-5 py-3 font-medium">Invoice</th>
                  <th scope="col" className="px-3 py-3 font-medium">Issued</th>
                  <th scope="col" className="px-3 py-3 font-medium">Due</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Amount</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Balance</th>
                  <th scope="col" className="px-3 py-3 font-medium">Status</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {invoices.map((inv) => {
                  const { total, balance } = invoiceTotals(inv);
                  const showBalance = balance > 0 && inv.status !== "cancelled" && inv.status !== "refunded";
                  return (
                    <tr key={inv.id} className="hover:bg-navy-50/50">
                      <td className="tabular px-5 py-3.5 font-semibold text-navy-900">{inv.invoiceNumber}</td>
                      <td className="tabular px-3 py-3.5 text-navy-600">{formatDateOnly(inv.issueDate)}</td>
                      <td className="tabular px-3 py-3.5 text-navy-600">{formatDateOnly(inv.dueDate)}</td>
                      <td className="tabular px-3 py-3.5 text-right font-medium text-navy-900">{formatCents(total)}</td>
                      <td className="tabular px-3 py-3.5 text-right text-navy-600">{showBalance ? formatCents(balance) : "—"}</td>
                      <td className="px-3 py-3.5"><StatusPill status={invoiceStatus(inv)} /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1">
                          <Link href={`/invoice/${inv.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-semibold text-accent-700 hover:bg-accent-100/60">
                            {showBalance ? "View & pay" : "View"} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                          </Link>
                          <a href={`/api/invoices/${inv.id}/pdf`} aria-label={`Download ${inv.invoiceNumber} PDF`} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-navy-500 hover:bg-navy-50 hover:text-navy-900">
                            <Download className="h-4 w-4" aria-hidden />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile list */}
            <ul className="divide-y divide-navy-100 md:hidden">
              {invoices.map((inv) => {
                const { total, balance } = invoiceTotals(inv);
                const showBalance = balance > 0 && inv.status !== "cancelled" && inv.status !== "refunded";
                return (
                  <li key={inv.id} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="tabular font-semibold text-navy-950">{inv.invoiceNumber}</p>
                        <p className="text-xs text-navy-500">
                          Issued {formatDateOnly(inv.issueDate)} · Due {formatDateOnly(inv.dueDate)}
                        </p>
                      </div>
                      <StatusPill status={invoiceStatus(inv)} />
                    </div>
                    <div className="mt-3 flex items-end justify-between">
                      <p className="tabular text-lg font-semibold text-navy-950">
                        {formatCents(total)}
                        {showBalance && <span className="ml-2 text-xs font-medium text-navy-500">{formatCents(balance)} due</span>}
                      </p>
                      <div className="flex gap-1">
                        <a href={`/api/invoices/${inv.id}/pdf`} aria-label={`Download ${inv.invoiceNumber} PDF`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-navy-200 text-navy-600">
                          <Download className="h-4 w-4" aria-hidden />
                        </a>
                        <Link href={`/invoice/${inv.id}`} className="inline-flex h-9 items-center rounded-lg bg-navy-900 px-3 text-[13px] font-semibold text-white">
                          {showBalance ? "Pay" : "View"}
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Panel>
    </div>
  );
}
