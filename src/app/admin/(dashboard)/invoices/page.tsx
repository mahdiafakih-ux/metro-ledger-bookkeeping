import Link from "next/link";
import { Plus, FileText, Download } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge, STATUS_TONES } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, titleCase } from "@/lib/utils";
import { formatCents } from "@/lib/money";

export default async function InvoicesPage() {
  const invoices = await prisma.invoice.findMany({ include: { items: true }, orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Invoices</h1>
          <p className="mt-1 text-sm text-navy-400">{invoices.length} invoice{invoices.length === 1 ? "" : "s"}</p>
        </div>
        <div className="flex gap-2">
          <LinkButton href="/api/export/invoices" variant="outline"><Download className="h-4 w-4" /> Export CSV</LinkButton>
          <LinkButton href="/admin/invoices/new"><Plus className="h-4 w-4" /> New Invoice</LinkButton>
        </div>
      </div>

      {invoices.length === 0 ? (
        <EmptyState icon={FileText} title="No invoices yet" description="Create your first invoice for a client or business." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-navy-50 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
                <tr>
                  <th className="px-5 py-3">Invoice #</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Issue Date</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {invoices.map((inv) => {
                  const total = inv.items.reduce((sum, i) => sum + i.amountCents, 0);
                  return (
                    <tr key={inv.id} className="hover:bg-navy-50">
                      <td className="px-5 py-3.5"><Link href={`/admin/invoices/${inv.id}`} className="font-semibold text-navy-900 hover:text-accent-600">{inv.invoiceNumber}</Link></td>
                      <td className="px-5 py-3.5 text-navy-600">{inv.clientName}{inv.company && ` (${inv.company})`}</td>
                      <td className="px-5 py-3.5 text-navy-500">{formatDate(inv.issueDate)}</td>
                      <td className="px-5 py-3.5 text-navy-500">{formatDate(inv.dueDate)}</td>
                      <td className="px-5 py-3.5 font-semibold text-navy-900">{formatCents(total)}</td>
                      <td className="px-5 py-3.5"><Badge tone={STATUS_TONES[inv.status] ?? "neutral"}>{titleCase(inv.status)}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
