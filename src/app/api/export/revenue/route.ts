import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";
import { formatDate, titleCase } from "@/lib/utils";
import { requireAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.revenueEntry.findMany({
    orderBy: { date: "desc" },
    include: { appointment: true, invoice: true },
  });
  const csv = toCsv(rows, [
    { header: "Date", value: (r) => formatDate((r as any).date) },
    { header: "Amount", value: (r) => ((r as any).amountCents / 100).toFixed(2) },
    { header: "Source", value: (r) => titleCase((r as any).source) },
    { header: "Description", value: (r) => (r as any).description },
    { header: "Appointment Confirmation #", value: (r) => (r as any).appointment?.confirmationNumber ?? "" },
    { header: "Invoice #", value: (r) => (r as any).invoice?.invoiceNumber ?? "" },
  ]);
  return csvResponse(csv, "notare-revenue.csv");
}
