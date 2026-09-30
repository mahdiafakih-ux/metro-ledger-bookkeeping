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
    { header: "Name", value: (r) => (r as any).name },
    { header: "Company", value: (r) => (r as any).company },
    { header: "Email", value: (r) => (r as any).email },
    { header: "Phone", value: (r) => (r as any).phone },
    { header: "Type", value: (r) => titleCase((r as any).clientType) },
    { header: "Lead Status", value: (r) => LEAD_STATUS_LABELS[(r as any).leadStatus] ?? (r as any).leadStatus },
    { header: "Total Appointments", value: (r) => (r as any).totalAppointments },
    { header: "Total Revenue", value: (r) => ((r as any).totalRevenueCents / 100).toFixed(2) },
    { header: "Follow-Up Date", value: (r) => ((r as any).followUpDate ? formatDate((r as any).followUpDate) : "") },
  ]);
  return csvResponse(csv, "notare-clients.csv");
}
