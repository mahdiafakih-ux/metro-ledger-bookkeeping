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
    { header: "Submitted", value: (r) => formatDateTime(r.createdAt) },
    { header: "Name", value: (r) => r.name },
    { header: "Company", value: (r) => r.company },
    { header: "Email", value: (r) => r.email },
    { header: "Phone", value: (r) => r.phone },
    { header: "Service Needed", value: (r) => r.serviceNeeded },
    { header: "Business Category", value: (r) => r.businessCategory },
    { header: "Message", value: (r) => r.message },
    { header: "Est. Appointments/Month", value: (r) => r.estimatedAppointmentsPerMonth },
    { header: "Business Lead", value: (r) => (r.isBusinessLead ? "Yes" : "No") },
    { header: "Handled", value: (r) => (r.handled ? "Yes" : "No") },
  ]);
  return csvResponse(csv, "notare-leads.csv");
}
