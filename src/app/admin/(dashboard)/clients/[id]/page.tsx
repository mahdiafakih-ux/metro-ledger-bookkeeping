import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, STATUS_TONES } from "@/components/ui/badge";
import { ClientForm } from "@/components/admin/client-form";
import { formatCents } from "@/lib/money";
import { LEAD_STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatDateTime, titleCase } from "@/lib/utils";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: { appointments: { orderBy: { scheduledStart: "desc" }, take: 20 } },
  });
  if (!client) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{client.name}</h1>
          <p className="mt-1 text-sm text-navy-400">{client.company || titleCase(client.clientType)}</p>
        </div>
        <Badge tone={STATUS_TONES[client.leadStatus] ?? "neutral"}>{LEAD_STATUS_LABELS[client.leadStatus]}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4"><p className="text-xs font-semibold uppercase text-navy-400">Total Appointments</p><p className="mt-1 text-xl font-bold text-navy-900">{client.totalAppointments}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold uppercase text-navy-400">Total Revenue</p><p className="mt-1 text-xl font-bold text-navy-900">{formatCents(client.totalRevenueCents, { showCents: false })}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold uppercase text-navy-400">Amount Owed</p><p className="mt-1 text-xl font-bold text-navy-900">{formatCents(client.amountOwedCents, { showCents: false })}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold uppercase text-navy-400">Follow-Up</p><p className="mt-1 text-xl font-bold text-navy-900">{client.followUpDate ? formatDate(client.followUpDate) : "—"}</p></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Appointment History</CardTitle></CardHeader>
        <CardBody className="p-0">
          {client.appointments.length === 0 ? (
            <p className="p-5 text-sm text-navy-400">No appointments yet.</p>
          ) : (
            <ul className="divide-y divide-navy-100">
              {client.appointments.map((a) => (
                <li key={a.id}>
                  <Link href={`/admin/appointments/${a.id}`} className="flex items-center justify-between p-4 hover:bg-navy-50">
                    <div>
                      <p className="text-sm font-semibold text-navy-900">{a.serviceType}</p>
                      <p className="text-xs text-navy-400">{formatDateTime(a.scheduledStart)}</p>
                    </div>
                    <Badge tone={STATUS_TONES[a.status] ?? "neutral"}>{titleCase(a.status)}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Edit Client</CardTitle></CardHeader>
        <CardBody>
          <ClientForm
            clientId={client.id}
            initial={{
              name: client.name,
              company: client.company,
              email: client.email,
              phone: client.phone,
              clientType: client.clientType,
              currentPackage: client.currentPackage,
              amountOwedDollars: client.amountOwedCents / 100,
              notes: client.notes,
              followUpDate: client.followUpDate ? client.followUpDate.toISOString().slice(0, 10) : "",
              leadStatus: client.leadStatus,
              leadSource: client.leadSource,
            }}
          />
        </CardBody>
      </Card>
    </div>
  );
}
