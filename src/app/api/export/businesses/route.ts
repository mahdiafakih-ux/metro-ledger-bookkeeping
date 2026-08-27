import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";
import { BUSINESS_CATEGORY_LABELS } from "@/lib/constants";
import { formatDate, titleCase } from "@/lib/utils";
import { requireAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.business.findMany({ orderBy: { createdAt: "desc" } });
  const csv = toCsv(rows, [
    { header: "Company", value: (r) => r.companyName },
    { header: "Category", value: (r) => BUSINESS_CATEGORY_LABELS[r.category] ?? r.category },
    { header: "Contact", value: (r) => r.contactName },
    { header: "Email", value: (r) => r.email },
    { header: "Phone", value: (r) => r.phone },
    { header: "Status", value: (r) => titleCase(r.status) },
    { header: "Monthly Usage", value: (r) => r.monthlyUsage },
    { header: "Monthly Revenue", value: (r) => (r.monthlyRevenueCents / 100).toFixed(2) },
    { header: "Renewal Date", value: (r) => (r.renewalDate ? formatDate(r.renewalDate) : "") },
  ]);
  return csvResponse(csv, "notare-businesses.csv");
}
