import { prisma } from "@/lib/db";
import { requireClientSession } from "@/lib/client-auth";
import { formatCents } from "@/lib/money";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Download } from "lucide-react";

export const metadata = { title: "Invoices" };

export default async function InvoicesPage() {
  const session = await requireClientSession();
  if (!session) return null;

  const invoices = await prisma.invoice.findMany({
    where: { clientId: session.clientId },
    include: { items: true },
    orderBy: { issueDate: "desc" },
  });

  const statusColors = {
    draft: "text-navy-600",
    sent: "text-blue-600",
    paid: "text-success-600",
    partially_paid: "text-warning-600",
    overdue: "text-danger-600",
    cancelled: "text-navy-400",
    refunded: "text-navy-500",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-navy-900">Invoices</h1>
        <p className="mt-2 text-navy-600">View and manage your invoices</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices ({invoices.length})</CardTitle>
        </CardHeader>
        <CardBody>
          {invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-navy-200 bg-navy-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-navy-900">Invoice #</th>
                    <th className="px-4 py-3 text-left font-semibold text-navy-900">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-navy-900">Description</th>
                    <th className="px-4 py-3 text-right font-semibold text-navy-900">Amount</th>
                    <th className="px-4 py-3 text-center font-semibold text-navy-900">Status</th>
                    <th className="px-4 py-3 text-center font-semibold text-navy-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => {
                    const total = inv.items.reduce((sum: number, i: any) => sum + i.amountCents, 0) + inv.taxCents;
                    const statusKey = inv.status as keyof typeof statusColors;
                    return (
                      <tr key={inv.id} className="border-b border-navy-100">
                        <td className="px-4 py-3 font-medium text-navy-900">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 text-navy-600">
                          {new Date(inv.issueDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-navy-600 max-w-xs truncate">{inv.notes || "—"}</td>
                        <td className="px-4 py-3 text-right font-semibold text-navy-900">
                          {formatCents(total)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusColors[statusKey]}`}>
                            {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link href={`/portal/invoices/${inv.id}`}>
                            <Button variant="ghost" size="sm">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-navy-600 py-8">No invoices yet</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
