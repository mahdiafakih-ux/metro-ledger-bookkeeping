import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";
import { formatDate, titleCase } from "@/lib/utils";
import { requireAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.invoice.findMany({ include: { items: true }, orderBy: { createdAt: "desc" } });
  const csv = toCsv(rows, [
    { header: "Invoice #", value: (r) => (r as any).invoiceNumber },
    { header: "Client", value: (r) => (r as any).clientName },
    { header: "Company", value: (r) => (r as any).company },
    { header: "Issue Date", value: (r) => formatDate((r as any).issueDate) },
    { header: "Due Date", value: (r) => formatDate((r as any).dueDate) },
    { header: "Status", value: (r) => titleCase((r as any).status) },
    { header: "Total", value: (r) => ((r as any).items.reduce((s: any, i: any) => s + i.amountCents, 0) / 100).toFixed(2) },
  ]);
  return csvResponse(csv, "notare-invoices.csv");
}
