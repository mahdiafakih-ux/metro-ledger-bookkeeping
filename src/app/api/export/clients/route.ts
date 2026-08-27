import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";
import { LEAD_STATUS_LABELS } from "@/lib/constants";
import { formatDate, titleCase } from "@/lib/utils";
import { requireAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.client.findMany({ orderBy: { createdAt: "desc" } });
  const csv = toCsv(rows, [
    { header: "Name", value: (r) => r.name },
    { header: "Company", value: (r) => r.company },
    { header: "Email", value: (r) => r.email },
    { header: "Phone", value: (r) => r.phone },
    { header: "Type", value: (r) => titleCase(r.clientType) },
    { header: "Lead Status", value: (r) => LEAD_STATUS_LABELS[r.leadStatus] ?? r.leadStatus },
    { header: "Total Appointments", value: (r) => r.totalAppointments },
    { header: "Total Revenue", value: (r) => (r.totalRevenueCents / 100).toFixed(2) },
    { header: "Follow-Up Date", value: (r) => (r.followUpDate ? formatDate(r.followUpDate) : "") },
  ]);
  return csvResponse(csv, "notare-clients.csv");
}
