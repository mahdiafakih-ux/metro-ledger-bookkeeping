import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CreditCard, Mail, Phone, RotateCcw } from "lucide-react";
import { prisma } from "@/lib/db";
import { appointmentScope, getPortalAccount, preferenceOwner } from "@/lib/portal/account";
import { appointmentStatus, appointmentTypeLabel } from "@/lib/portal/present";
import { PREFERENCE_DISCLAIMER } from "@/lib/portal/constants";
import { getBusinessSettings } from "@/lib/settings";
import { formatCents } from "@/lib/money";
import { formatDetroitDate } from "@/lib/tz";
import { telHref } from "@/lib/utils";
import { timeWithZone } from "@/components/portal/appointment-views";
import { AddPreferredButton } from "@/components/portal/notary-actions";
import { KeyValue, NotaryAvatar, Panel, PanelHeader, PortalLink, StatusPill } from "@/components/portal/ui";

export const metadata = { title: "Appointment" };

const notarySelect = { id: true, displayName: true, photoUrl: true, isActive: true } as const;

export default async function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await getPortalAccount();

  // Authorization: only appointments inside this account's scope.
  const a = await prisma.appointment.findFirst({
    where: { AND: [{ id }, appointmentScope(account)] },
    include: { assignedNotary: { select: notarySelect }, preferredNotary: { select: notarySelect } },
  });
  if (!a) notFound();

  const [settings, preference] = await Promise.all([
    getBusinessSettings(),
    a.assignedNotaryId
      ? prisma.preferredNotary.findFirst({ where: { ...preferenceOwner(account), notaryId: a.assignedNotaryId } })
      : Promise.resolve(null),
  ]);

  const status = appointmentStatus(a);
  const balance = Math.max(0, a.totalAmountCents - a.amountPaidCents);
  const coveredByPlan = a.totalAmountCents === 0 && a.businessId != null;
  const notary = a.assignedNotary;
  const isUpcoming = a.status === "scheduled" && a.scheduledEnd >= new Date();

  return (
    <div className="portal-enter space-y-6">
      <Link href="/portal/appointments" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-navy-500 hover:text-navy-900">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Appointments
      </Link>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-navy-950">{a.serviceType}</h1>
            <StatusPill status={status} />
          </div>
          <p className="tabular mt-1 text-[15px] text-navy-500">
            {formatDetroitDate(a.scheduledStart, { weekday: "long", month: "long" })} · {timeWithZone(a.scheduledStart)}
          </p>
        </div>
        <p className="tabular text-sm text-navy-500">
          Confirmation <span className="font-semibold text-navy-900">{a.confirmationNumber}</span>
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel>
            <PanelHeader title="Details" />
            <dl className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
              <KeyValue label="Date">{formatDetroitDate(a.scheduledStart, { weekday: "short" })}</KeyValue>
              <KeyValue label="Time">
                <span className="tabular">
                  {timeWithZone(a.scheduledStart)} – {timeWithZone(a.scheduledEnd)}
                </span>
              </KeyValue>
              <KeyValue label="Format">{appointmentTypeLabel(a.type)}</KeyValue>
              {a.type !== "remote" && <KeyValue label="Location">{a.address || "—"}</KeyValue>}
              <KeyValue label="Document(s)">{a.documentType || "—"}</KeyValue>
              <KeyValue label="Notarial acts (estimated)">{a.numberOfActs}</KeyValue>
              {a.company && <KeyValue label="Company">{a.company}</KeyValue>}
              <KeyValue label="Contact">{a.clientName}</KeyValue>
            </dl>
          </Panel>

          <Panel>
            <PanelHeader title="Charges" description="Statutory notarial fees are shown separately from other services." />
            <div className="p-5">
              {coveredByPlan ? (
                <p className="text-sm text-navy-600">
                  Submitted under your business plan. Any applicable Michigan statutory notarial-act fees are recorded
                  separately after the appointment, based on the acts actually performed, and appear on your invoices.
                </p>
              ) : (
                <dl className="space-y-2 text-sm">
                  <Row label={`Statutory notarial fees (${a.numberOfActs} act${a.numberOfActs === 1 ? "" : "s"})`} value={a.statutoryFeeCents} />
                  {a.travelFeeCents > 0 && <Row label="Travel" value={a.travelFeeCents} />}
                  {a.otherFeesCents > 0 && <Row label="Other services" value={a.otherFeesCents} />}
                  <div className="my-2 h-px bg-navy-100" />
                  <Row label="Total" value={a.totalAmountCents} strong />
                  {a.amountPaidCents > 0 && <Row label="Paid" value={a.amountPaidCents} />}
                  {balance > 0 && a.paymentStatus !== "paid" && <Row label="Balance due" value={balance} strong />}
                </dl>
              )}
              {!coveredByPlan && balance > 0 && a.paymentStatus !== "paid" && a.status !== "cancelled" && (
                <PortalLink href={`/book/confirmation/${a.id}`} className="mt-5 w-full sm:w-auto">
                  <CreditCard className="h-4 w-4" aria-hidden /> Pay {formatCents(balance)} online
                </PortalLink>
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel>
            <PanelHeader title={a.status === "completed" ? "Your notary" : "Notary"} />
            <div className="p-5">
              {notary ? (
                <>
                  <div className="flex items-center gap-3">
                    <NotaryAvatar name={notary.displayName} photoUrl={notary.photoUrl} size={48} />
                    <div>
                      <p className="font-semibold text-navy-950">{notary.displayName}</p>
                      <p className="text-[13px] text-navy-500">
                        {a.status === "completed" ? "Handled this appointment" : "Assigned to this appointment"}
                      </p>
                    </div>
                  </div>
                  {a.status === "completed" && account.canRequest && (
                    <div className="mt-5 space-y-2">
                      {notary.isActive && (
                        <PortalLink href={`/portal/request?notary=${notary.id}`} className="w-full">
                          <RotateCcw className="h-4 w-4" aria-hidden /> Request {notary.displayName} again
                        </PortalLink>
                      )}
                      {notary.isActive && (
                        <AddPreferredButton
                          notaryId={notary.id}
                          name={notary.displayName}
                          isPreferred={!!preference}
                          size="md"
                          className="w-full justify-center"
                        />
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-navy-600">
                  {isUpcoming
                    ? "A Notar-E notary will be assigned before your appointment."
                    : "No notary was recorded for this appointment."}
                </p>
              )}
              {a.preferredNotary && a.status === "scheduled" && (
                <div className="mt-4 rounded-lg bg-navy-50 p-3 text-[13px] text-navy-600">
                  <p className="font-semibold text-navy-900">You requested {a.preferredNotary.displayName}</p>
                  <p className="mt-1">{PREFERENCE_DISCLAIMER}</p>
                </div>
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Need to make a change?" />
            <div className="space-y-3 p-5 text-sm">
              <p className="text-navy-600">To reschedule or cancel, contact Notar-E and include your confirmation number.</p>
              <a href={telHref(settings.phone)} className="flex items-center gap-2 font-semibold text-navy-900 hover:text-accent-700">
                <Phone className="h-4 w-4 text-navy-400" aria-hidden /> {settings.phone}
              </a>
              <a
                href={`mailto:${settings.email}?subject=${encodeURIComponent(`Appointment ${a.confirmationNumber}`)}`}
                className="flex items-center gap-2 font-semibold text-navy-900 hover:text-accent-700"
              >
                <Mail className="h-4 w-4 text-navy-400" aria-hidden /> {settings.email}
              </a>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={strong ? "font-semibold text-navy-900" : "text-navy-500"}>{label}</dt>
      <dd className={`tabular ${strong ? "font-semibold text-navy-950" : "text-navy-800"}`}>{formatCents(value)}</dd>
    </div>
  );
}
