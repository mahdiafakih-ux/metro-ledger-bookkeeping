import { prisma } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export async function GET() {
  const rows = await prisma.expense.findMany({ orderBy: { date: "desc" } });
  const csv = toCsv(rows, [
    { header: "Date", value: (r) => formatDate(r.date) },
    { header: "Description", value: (r) => r.description },
    { header: "Category", value: (r) => EXPENSE_CATEGORY_LABELS[r.category] ?? r.category },
    { header: "Vendor", value: (r) => r.vendor },
    { header: "Amount", value: (r) => (r.amountCents / 100).toFixed(2) },
    { header: "Notes", value: (r) => r.notes },
  ]);
  return csvResponse(csv, "notare-expenses.csv");
}
