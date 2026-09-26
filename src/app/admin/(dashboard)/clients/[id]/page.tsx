import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone, Mail } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, STATUS_TONES } from "@/components/ui/badge";
import { ClientForm } from "@/components/admin/client-form";
import { formatCents } from "@/lib/money";
import { LEAD_STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatDateTime, titleCase, telHref } from "@/lib/utils";
import { isSubscriptionPlanKey, planDisplayName } from "@/lib/plans";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      appointments: { orderBy: { scheduledStart: "desc" }, take: 20 },
      invoices: { orderBy: { issueDate: "desc" }, take: 10, include: { items: true } },
    },
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

      {(client.phone || client.email) && (
        <div className="flex flex-wrap gap-2">
          {client.phone && (
            <a
              href={telHref(client.phone)}
              className="flex h-11 items-center gap-2 rounded-full bg-success-100/60 px-4 text-sm font-semibold text-success-700 active:bg-success-100"
            >
              <Phone className="h-4 w-4" /> {client.phone}
            </a>
          )}
          {client.email && (
            <a
              href={`mailto:${client.email}`}
              className="flex h-11 items-center gap-2 rounded-full bg-accent-100/60 px-4 text-sm font-semibold text-accent-700 active:bg-accent-100"
            >
              <Mail className="h-4 w-4" /> {client.email}
            </a>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4"><p className="text-xs font-semibold uppercase text-navy-400">Total Appointments</p><p className="mt-1 text-xl font-bold text-navy-900">{client.totalAppointments}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold uppercase text-navy-400">Total Revenue</p><p className="mt-1 text-xl font-bold text-navy-900">{formatCents(client.totalRevenueCents, { showCents: false })}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold uppercase text-navy-400">Amount Owed</p><p className="mt-1 text-xl font-bold text-navy-900">{formatCents(client.amountOwedCents, { showCents: false })}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold uppercase text-navy-400">Follow-Up</p><p className="mt-1 text-xl font-bold text-navy-900">{client.followUpDate ? formatDate(client.followUpDate) : "—"}</p></Card>
      </div>

      {/* Billing & Subscription Section */}
      {client.currentPlanKey && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription & Billing</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-navy-400">Current Plan</p>
                <p className="mt-1 text-lg font-bold text-navy-900">
                  {planDisplayName(client.currentPlanKey)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-navy-400">Subscription Status</p>
                <p className="mt-1 text-lg font-bold text-navy-900 capitalize">
                  {client.subscriptionStatus || "—"}
                </p>
              </div>
              {client.stripeCustomerId && (
                <div>
                  <p className="text-xs font-semibold uppercase text-navy-400">Stripe Customer ID</p>
                  <p className="mt-1 text-sm font-mono text-navy-700">{client.stripeCustomerId}</p>
                </div>
              )}
              {client.stripeSubscriptionId && (
                <div>
                  <p className="text-xs font-semibold uppercase text-navy-400">Stripe Subscription ID</p>
                  <p className="mt-1 text-sm font-mono text-navy-700">{client.stripeSubscriptionId}</p>
                </div>
              )}
              {client.nextBillingDate && (
                <div>
                  <p className="text-xs font-semibold uppercase text-navy-400">Next Billing Date</p>
                  <p className="mt-1 text-lg font-bold text-navy-900">
                    {formatDate(client.nextBillingDate)}
                  </p>
                </div>
              )}
              {isSubscriptionPlanKey(client.currentPlanKey) && (
                <div>
                  <p className="text-xs font-semibold uppercase text-navy-400">Monthly Usage</p>
                  <p className="mt-1 text-lg font-bold text-navy-900">
                    {client.monthlyUsageCount} notarizations
                  </p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Appointment History</CardTitle></CardHeader>
        <CardBody className="p-0">
          {client.appointments.length === 0 ? (
            <p className="p-5 text-sm text-navy-400">No appointments yet.</p>
          ) : (
            <ul className="divide-y divide-navy-100">
              {client.appointments.map((a: any) => (
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

      {/* Invoices Section */}
      <Card>
        <CardHeader><CardTitle>Invoices ({client.invoices.length})</CardTitle></CardHeader>
        <CardBody className="p-0">
          {client.invoices.length === 0 ? (
            <p className="p-5 text-sm text-navy-400">No invoices yet.</p>
          ) : (
            <ul className="divide-y divide-navy-100">
              {client.invoices.map((inv: any) => {
                const total = inv.items.reduce((sum, i) => sum + i.amountCents, 0) + inv.taxCents;
                return (
                  <li key={inv.id}>
                    <Link href={`/admin/invoices/${inv.id}`} className="flex items-center justify-between p-4 hover:bg-navy-50">
                      <div>
                        <p className="text-sm font-semibold text-navy-900">{inv.invoiceNumber}</p>
                        <p className="text-xs text-navy-400">{formatDate(inv.issueDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-navy-900">{formatCents(total)}</p>
                        <Badge tone={STATUS_TONES[inv.status] ?? "neutral"}>{titleCase(inv.status)}</Badge>
                      </div>
                    </Link>
                  </li>
                );
              })}
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
