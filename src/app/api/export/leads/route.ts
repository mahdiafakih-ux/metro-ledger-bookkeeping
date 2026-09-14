import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";
import { formatDateTime } from "@/lib/utils";
import { requireAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.leadCapture.findMany({ orderBy: { createdAt: "desc" } });
  const csv = toCsv(rows, [
    { header: "Submitted", value: (r) => formatDateTime((r as any).createdAt) },
    { header: "Name", value: (r) => (r as any).name },
    { header: "Company", value: (r) => (r as any).company },
    { header: "Email", value: (r) => (r as any).email },
    { header: "Phone", value: (r) => (r as any).phone },
    { header: "Service Needed", value: (r) => (r as any).serviceNeeded },
    { header: "Business Category", value: (r) => (r as any).businessCategory },
    { header: "Message", value: (r) => (r as any).message },
    { header: "Est. Appointments/Month", value: (r) => (r as any).estimatedAppointmentsPerMonth },
    { header: "Business Lead", value: (r) => ((r as any).isBusinessLead ? "Yes" : "No") },
    { header: "Handled", value: (r) => ((r as any).handled ? "Yes" : "No") },
  ]);
  return csvResponse(csv, "notare-leads.csv");
}
