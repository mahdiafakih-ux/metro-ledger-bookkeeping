import Link from "next/link";
import { Plus, MapPin, Video, ClipboardList, Download } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge, STATUS_TONES } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCents } from "@/lib/money";
import { formatDateTime, titleCase } from "@/lib/utils";

const STATUS_FILTERS = ["all", "scheduled", "completed", "cancelled", "no_show"];

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status = "all", q = "" } = await searchParams;

  const appointments = await prisma.appointment.findMany({
    where: {
      ...(status !== "all" ? { status } : {}),
      ...(q
        ? {
            OR: [
              { clientName: { contains: q } },
              { company: { contains: q } },
              { confirmationNumber: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { scheduledStart: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Appointments</h1>
          <p className="mt-1 text-sm text-navy-400">{appointments.length} appointment{appointments.length === 1 ? "" : "s"}</p>
        </div>
        <div className="flex gap-2">
          <LinkButton href="/api/export/appointments" variant="outline"><Download className="h-4 w-4" /> Export CSV</LinkButton>
          <LinkButton href="/admin/appointments/new"><Plus className="h-4 w-4" /> New Appointment</LinkButton>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((s) => (
          <Link
            key={s}
            href={`/admin/appointments?status=${s}${q ? `&q=${q}` : ""}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${status === s ? "bg-navy-900 text-white" : "bg-white text-navy-500 border border-navy-100"}`}
          >
            {s === "all" ? "All" : titleCase(s)}
          </Link>
        ))}
        <form className="ml-auto">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search appointments..."
            className="w-56 rounded-lg border border-navy-200 px-3 py-1.5 text-sm focus:border-accent-500 focus:outline-none"
          />
          <input type="hidden" name="status" value={status} />
        </form>
      </div>

      {appointments.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No appointments found" description="Try adjusting your filters or create a new appointment." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-navy-50 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
                <tr>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Date & Time</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {appointments.map((a: any) => (
                  <tr key={a.id} className="hover:bg-navy-50">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/appointments/${a.id}`} className="font-semibold text-navy-900 hover:text-accent-600">{a.clientName}</Link>
                      {a.company && <p className="text-xs text-navy-400">{a.company}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-navy-600">{a.serviceType}</td>
                    <td className="px-5 py-3.5 text-navy-600">{formatDateTime(a.scheduledStart)}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-navy-500">
                        {a.type === "remote" ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                        {titleCase(a.type)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-navy-900">{formatCents(a.totalAmountCents, { showCents: false })}</td>
                    <td className="px-5 py-3.5"><Badge tone={STATUS_TONES[a.status] ?? "neutral"}>{titleCase(a.status)}</Badge></td>
                    <td className="px-5 py-3.5"><Badge tone={STATUS_TONES[a.paymentStatus] ?? "neutral"}>{titleCase(a.paymentStatus)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
