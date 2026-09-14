import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";
import { BUSINESS_CATEGORY_LABELS, OUTREACH_METHOD_LABELS, OUTREACH_RESPONSE_LABELS } from "@/lib/constants";
import { formatDate, titleCase } from "@/lib/utils";
import { requireAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.outreachLog.findMany({ orderBy: { dateContacted: "desc" } });
  const csv = toCsv(rows, [
    { header: "Business", value: (r) => (r as any).businessName },
    { header: "Contact", value: (r) => (r as any).contactName },
    { header: "Phone", value: (r) => (r as any).phone },
    { header: "Email", value: (r) => (r as any).email },
    { header: "Type", value: (r) => BUSINESS_CATEGORY_LABELS[(r as any).companyType] ?? (r as any).companyType },
    { header: "Date Contacted", value: (r) => formatDate((r as any).dateContacted) },
    { header: "Method", value: (r) => OUTREACH_METHOD_LABELS[(r as any).method] ?? (r as any).method },
    { header: "Response", value: (r) => OUTREACH_RESPONSE_LABELS[(r as any).response] ?? (r as any).response },
    { header: "Status", value: (r) => titleCase((r as any).status) },
  ]);
  return csvResponse(csv, "notare-outreach.csv");
}
