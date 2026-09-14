import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";
import { formatDateTime, titleCase } from "@/lib/utils";
import { requireAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.appointment.findMany({ orderBy: { scheduledStart: "desc" } });
  const csv = toCsv(rows, [
    { header: "Confirmation #", value: (r) => (r as any).confirmationNumber },
    { header: "Client", value: (r) => (r as any).clientName },
    { header: "Company", value: (r) => (r as any).company },
    { header: "Service", value: (r) => (r as any).serviceType },
    { header: "Type", value: (r) => titleCase((r as any).type) },
    { header: "Date/Time", value: (r) => formatDateTime((r as any).scheduledStart) },
    { header: "Status", value: (r) => titleCase((r as any).status) },
    { header: "Payment Status", value: (r) => titleCase((r as any).paymentStatus) },
    { header: "Total", value: (r) => ((r as any).totalAmountCents / 100).toFixed(2) },
  ]);
  return csvResponse(csv, "notare-appointments.csv");
}
