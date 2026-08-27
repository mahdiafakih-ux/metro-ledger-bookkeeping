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
    { header: "Business", value: (r) => r.businessName },
    { header: "Contact", value: (r) => r.contactName },
    { header: "Phone", value: (r) => r.phone },
    { header: "Email", value: (r) => r.email },
    { header: "Type", value: (r) => BUSINESS_CATEGORY_LABELS[r.companyType] ?? r.companyType },
    { header: "Date Contacted", value: (r) => formatDate(r.dateContacted) },
    { header: "Method", value: (r) => OUTREACH_METHOD_LABELS[r.method] ?? r.method },
    { header: "Response", value: (r) => OUTREACH_RESPONSE_LABELS[r.response] ?? r.response },
    { header: "Status", value: (r) => titleCase(r.status) },
  ]);
  return csvResponse(csv, "notare-outreach.csv");
}
