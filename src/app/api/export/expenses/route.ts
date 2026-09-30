import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { requireAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.expense.findMany({ orderBy: { date: "desc" } });
  const csv = toCsv(rows, [
    { header: "Date", value: (r) => formatDate((r as any).date) },
    { header: "Description", value: (r) => (r as any).description },
    { header: "Category", value: (r) => EXPENSE_CATEGORY_LABELS[(r as any).category] ?? (r as any).category },
    { header: "Vendor", value: (r) => (r as any).vendor },
    { header: "Amount", value: (r) => ((r as any).amountCents / 100).toFixed(2) },
    { header: "Notes", value: (r) => (r as any).notes },
  ]);
  return csvResponse(csv, "notare-expenses.csv");
}
