import { prisma } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";
import { formatDate, titleCase } from "@/lib/utils";

export async function GET() {
  const rows = await prisma.invoice.findMany({ include: { items: true }, orderBy: { createdAt: "desc" } });
  const csv = toCsv(rows, [
    { header: "Invoice #", value: (r) => r.invoiceNumber },
    { header: "Client", value: (r) => r.clientName },
    { header: "Company", value: (r) => r.company },
    { header: "Issue Date", value: (r) => formatDate(r.issueDate) },
    { header: "Due Date", value: (r) => formatDate(r.dueDate) },
    { header: "Status", value: (r) => titleCase(r.status) },
    { header: "Total", value: (r) => (r.items.reduce((s, i) => s + i.amountCents, 0) / 100).toFixed(2) },
  ]);
  return csvResponse(csv, "notare-invoices.csv");
}
