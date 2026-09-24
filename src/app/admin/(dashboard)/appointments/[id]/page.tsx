import { utcToDatetimeLocal } from "@/lib/tz";
import { notFound } from "next/navigation";
import { Phone, Mail } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, STATUS_TONES } from "@/components/ui/badge";
import { AppointmentActions } from "@/components/admin/appointment-actions";
import { AppointmentForm } from "@/components/admin/appointment-form";
import { NotaryAssign } from "@/components/admin/notary-assign";
import { titleCase, telHref } from "@/lib/utils";

// Detroit wall time for the datetime-local input (server TZ-independent).
const toDatetimeLocal = utcToDatetimeLocal;

export default async function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { preferredNotary: { select: { displayName: true } } },
  });
  if (!appointment) notFound();

  const [clients, businesses, notaries] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, company: true, email: true, phone: true } }),
    prisma.business.findMany({ orderBy: { companyName: "asc" }, select: { id: true, companyName: true, contactName: true, email: true, phone: true } }),
    prisma.notary.findMany({ orderBy: { displayName: "asc" }, select: { id: true, displayName: true, isActive: true } }),
  ]);
  const PREFERENCE_LABELS: Record<string, string> = {
    first_available: "First available",
    preferred: "Preferred notary",
    no_preference: "No preference",
  };

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

      {(appointment.phone || appointment.email) && (
        <div className="flex flex-wrap gap-2">
          {appointment.phone && (
            <a
              href={telHref(appointment.phone)}
              className="flex h-11 items-center gap-2 rounded-full bg-success-100/60 px-4 text-sm font-semibold text-success-700 active:bg-success-100"
            >
              <Phone className="h-4 w-4" /> {appointment.phone}
            </a>
          )}
          {appointment.email && (
            <a
              href={`mailto:${appointment.email}`}
              className="flex h-11 items-center gap-2 rounded-full bg-accent-100/60 px-4 text-sm font-semibold text-accent-700 active:bg-accent-100"
            >
              <Mail className="h-4 w-4" /> {appointment.email}
            </a>
          )}
        </div>
      )}

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
        <CardHeader><CardTitle>Notary</CardTitle></CardHeader>
        <CardBody className="space-y-3">
          {appointment.notaryPreference && (
            <p className="text-sm text-navy-600">
              Client preference: <strong>{PREFERENCE_LABELS[appointment.notaryPreference] ?? appointment.notaryPreference}</strong>
              {appointment.preferredNotary && <> — requested <strong>{appointment.preferredNotary.displayName}</strong></>}
            </p>
          )}
          {notaries.length === 0 ? (
            <p className="text-sm text-navy-400">
              No notaries set up yet. <a href="/admin/notaries" className="font-semibold text-accent-600">Add notaries</a> to assign one.
            </p>
          ) : (
            <NotaryAssign appointmentId={appointment.id} current={appointment.assignedNotaryId} notaries={notaries} />
          )}
          <p className="text-xs text-navy-400">Clients see the assigned notary&apos;s display name in their portal.</p>
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
