import { prisma } from "@/lib/db";
import { toCsv, csvResponse } from "@/lib/csv";
import { formatDateTime, titleCase } from "@/lib/utils";

export async function GET() {
  const rows = await prisma.appointment.findMany({ orderBy: { scheduledStart: "desc" } });
  const csv = toCsv(rows, [
    { header: "Confirmation #", value: (r) => r.confirmationNumber },
    { header: "Client", value: (r) => r.clientName },
    { header: "Company", value: (r) => r.company },
    { header: "Service", value: (r) => r.serviceType },
    { header: "Type", value: (r) => titleCase(r.type) },
    { header: "Date/Time", value: (r) => formatDateTime(r.scheduledStart) },
    { header: "Status", value: (r) => titleCase(r.status) },
    { header: "Payment Status", value: (r) => titleCase(r.paymentStatus) },
    { header: "Total", value: (r) => (r.totalAmountCents / 100).toFixed(2) },
  ]);
  return csvResponse(csv, "notare-appointments.csv");
}
