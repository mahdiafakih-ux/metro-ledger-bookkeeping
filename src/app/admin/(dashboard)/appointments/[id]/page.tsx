import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, STATUS_TONES } from "@/components/ui/badge";
import { AppointmentActions } from "@/components/admin/appointment-actions";
import { AppointmentForm } from "@/components/admin/appointment-form";
import { titleCase } from "@/lib/utils";

function toDatetimeLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) notFound();

  const [clients, businesses] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, company: true, email: true, phone: true } }),
    prisma.business.findMany({ orderBy: { companyName: "asc" }, select: { id: true, companyName: true, contactName: true, email: true, phone: true } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{appointment.clientName}</h1>
          <p className="mt-1 text-sm text-navy-400">
            Confirmation #{appointment.confirmationNumber} · {appointment.serviceType}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge tone={STATUS_TONES[appointment.status] ?? "neutral"}>{titleCase(appointment.status)}</Badge>
          <Badge tone={STATUS_TONES[appointment.paymentStatus] ?? "neutral"}>{titleCase(appointment.paymentStatus)}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
        <CardBody>
          <AppointmentActions
            id={appointment.id}
            status={appointment.status}
            paymentStatus={appointment.paymentStatus}
            balanceDueCents={appointment.totalAmountCents - appointment.amountPaidCents}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Edit Appointment</CardTitle></CardHeader>
        <CardBody>
          <AppointmentForm
            appointmentId={appointment.id}
            clients={clients}
            businesses={businesses}
            initial={{
              type: appointment.type,
              status: appointment.status,
              clientId: appointment.clientId ?? "",
              businessId: appointment.businessId ?? "",
              clientName: appointment.clientName,
              company: appointment.company,
              email: appointment.email,
              phone: appointment.phone,
              address: appointment.address,
              serviceType: appointment.serviceType,
              documentType: appointment.documentType,
              numberOfActs: appointment.numberOfActs,
              statutoryFeeCents: appointment.statutoryFeeCents,
              travelFeeCents: appointment.travelFeeCents,
              otherFeesCents: appointment.otherFeesCents,
              totalAmountCents: appointment.totalAmountCents,
              scheduledStart: toDatetimeLocal(appointment.scheduledStart),
              paymentStatus: appointment.paymentStatus,
              paymentMethod: appointment.paymentMethod,
              notes: appointment.notes,
              followUpDate: appointment.followUpDate ? appointment.followUpDate.toISOString().slice(0, 10) : "",
              isRecurring: appointment.isRecurring,
              recurrenceRule: appointment.recurrenceRule,
            }}
          />
        </CardBody>
      </Card>
    </div>
  );
}
