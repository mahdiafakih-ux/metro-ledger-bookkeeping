import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";
import { formatDate } from "@/lib/utils";
import { requireAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await prisma.mileageLog.findMany({ orderBy: { date: "desc" } });
  const csv = toCsv(rows, [
    { header: "Date", value: (r) => formatDate(r.date) },
    { header: "Start Location", value: (r) => r.startLocation },
    { header: "Destination", value: (r) => r.destination },
    { header: "Purpose", value: (r) => r.purpose },
    { header: "Miles", value: (r) => r.miles },
    { header: "Client", value: (r) => r.clientName },
  ]);
  return csvResponse(csv, "notare-mileage.csv");
}
