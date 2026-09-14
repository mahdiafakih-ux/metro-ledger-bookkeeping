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
    { header: "Company", value: (r) => (r as any).companyName },
    { header: "Category", value: (r) => BUSINESS_CATEGORY_LABELS[(r as any).category] ?? (r as any).category },
    { header: "Contact", value: (r) => (r as any).contactName },
    { header: "Email", value: (r) => (r as any).email },
    { header: "Phone", value: (r) => (r as any).phone },
    { header: "Status", value: (r) => titleCase((r as any).status) },
    { header: "Monthly Usage", value: (r) => (r as any).monthlyUsage },
    { header: "Monthly Revenue", value: (r) => ((r as any).monthlyRevenueCents / 100).toFixed(2) },
    { header: "Renewal Date", value: (r) => ((r as any).renewalDate ? formatDate((r as any).renewalDate) : "") },
  ]);
  return csvResponse(csv, "notare-businesses.csv");
}
