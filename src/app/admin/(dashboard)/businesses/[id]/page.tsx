import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone, Mail } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, STATUS_TONES } from "@/components/ui/badge";
import { BusinessForm } from "@/components/admin/business-form";
import { formatCents } from "@/lib/money";
import { BUSINESS_CATEGORY_LABELS } from "@/lib/constants";
import { formatDate, formatDateTime, titleCase, telHref } from "@/lib/utils";

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [business, plans, invoices, revenueAgg] = await Promise.all([
    prisma.business.findUnique({ where: { id }, include: { appointments: { orderBy: { scheduledStart: "desc" }, take: 20 } } }),
    prisma.pricingPlan.findMany({ where: { billingPeriod: "monthly" }, select: { key: true, name: true } }),
    prisma.invoice.findMany({ where: { businessId: id, status: { in: ["sent", "overdue", "partially_paid"] } }, include: { items: true } }),
    prisma.revenueEntry.aggregate({
      where: { OR: [{ appointment: { businessId: id } }, { invoice: { businessId: id } }] },
      _sum: { amountCents: true },
    }),
  ]);
  if (!business) notFound();

  const completedAppointments = business.appointments.filter((a) => a.status === "completed").length;
  const outstandingCents = invoices.reduce((sum, inv) => sum + inv.items.reduce((s, i) => s + i.amountCents, 0) + inv.taxCents - inv.amountPaidCents, 0);
  const lifetimeRevenueCents = revenueAgg._sum.amountCents ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{business.companyName}</h1>
          <p className="mt-1 text-sm text-navy-400">{BUSINESS_CATEGORY_LABELS[business.category]} · {business.contactName}</p>
        </div>
        <Badge tone={STATUS_TONES[business.status] ?? "neutral"}>{titleCase(business.status)}</Badge>
      </div>

      {(business.phone || business.email) && (
        <div className="flex flex-wrap gap-2">
          {business.phone && (
            <a
              href={telHref(business.phone)}
              className="flex h-11 items-center gap-2 rounded-full bg-success-100/60 px-4 text-sm font-semibold text-success-700 active:bg-success-100"
            >
              <Phone className="h-4 w-4" /> {business.phone}
            </a>
          )}
          {business.email && (
            <a
              href={`mailto:${business.email}`}
              className="flex h-11 items-center gap-2 rounded-full bg-accent-100/60 px-4 text-sm font-semibold text-accent-700 active:bg-accent-100"
            >
              <Mail className="h-4 w-4" /> {business.email}
            </a>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4"><p className="text-xs font-semibold uppercase text-navy-400">Lifetime Revenue</p><p className="mt-1 text-xl font-bold text-success-600">{formatCents(lifetimeRevenueCents, { showCents: false })}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold uppercase text-navy-400">Completed Appointments</p><p className="mt-1 text-xl font-bold text-navy-900">{completedAppointments}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold uppercase text-navy-400">Outstanding Invoices</p><p className="mt-1 text-xl font-bold text-danger-600">{formatCents(outstandingCents, { showCents: false })}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold uppercase text-navy-400">Monthly Revenue</p><p className="mt-1 text-xl font-bold text-navy-900">{formatCents(business.monthlyRevenueCents, { showCents: false })}</p></Card>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4"><p className="text-xs font-semibold uppercase text-navy-400">Monthly Usage</p><p className="mt-1 text-xl font-bold text-navy-900">{business.monthlyUsage}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold uppercase text-navy-400">Contract Start</p><p className="mt-1 text-xl font-bold text-navy-900">{business.contractStart ? formatDate(business.contractStart) : "—"}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold uppercase text-navy-400">Contract End</p><p className="mt-1 text-xl font-bold text-navy-900">{business.contractEndDate ? formatDate(business.contractEndDate) : "—"}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold uppercase text-navy-400">Renewal</p><p className="mt-1 text-xl font-bold text-navy-900">{business.renewalDate ? formatDate(business.renewalDate) : "—"}</p></Card>
      </div>

      {(business.billingContactName || business.billingContactEmail) && (
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase text-navy-400">Billing Contact</p>
          <p className="mt-1 font-medium text-navy-900">{business.billingContactName || business.contactName}</p>
          <p className="text-sm text-navy-500">{business.billingContactEmail} {business.billingContactPhone && `· ${business.billingContactPhone}`}</p>
        </Card>
      )}

      {invoices.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Outstanding Invoices</CardTitle></CardHeader>
          <CardBody className="p-0">
            <ul className="divide-y divide-navy-100">
              {invoices.map((inv) => {
                const total = inv.items.reduce((s, i) => s + i.amountCents, 0) + inv.taxCents;
                return (
                  <li key={inv.id}>
                    <Link href={`/admin/invoices/${inv.id}`} className="flex items-center justify-between p-4 hover:bg-navy-50">
                      <div>
                        <p className="text-sm font-semibold text-navy-900">{inv.invoiceNumber}</p>
                        <p className="text-xs text-navy-400">Due {formatDate(inv.dueDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-navy-900">{formatCents(total - inv.amountPaidCents)}</p>
                        <Badge tone={STATUS_TONES[inv.status] ?? "neutral"}>{titleCase(inv.status)}</Badge>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Appointment History</CardTitle></CardHeader>
        <CardBody className="p-0">
          {business.appointments.length === 0 ? (
            <p className="p-5 text-sm text-navy-400">No appointments yet.</p>
          ) : (
            <ul className="divide-y divide-navy-100">
              {business.appointments.map((a) => (
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
        <CardHeader><CardTitle>Edit Business</CardTitle></CardHeader>
        <CardBody>
          <BusinessForm
            businessId={business.id}
            pricingPlans={plans}
            initial={{
              companyName: business.companyName,
              category: business.category,
              contactName: business.contactName,
              email: business.email,
              phone: business.phone,
              billingContactName: business.billingContactName,
              billingContactEmail: business.billingContactEmail,
              billingContactPhone: business.billingContactPhone,
              packageKey: business.packageKey,
              monthlyUsage: business.monthlyUsage,
              monthlyRevenueDollars: business.monthlyRevenueCents / 100,
              expectedMonthlyVolume: business.expectedMonthlyVolume,
              customPricingNotes: business.customPricingNotes,
              status: business.status,
              contractStart: business.contractStart ? business.contractStart.toISOString().slice(0, 10) : "",
              contractEndDate: business.contractEndDate ? business.contractEndDate.toISOString().slice(0, 10) : "",
              renewalDate: business.renewalDate ? business.renewalDate.toISOString().slice(0, 10) : "",
              notes: business.notes,
              followUpDate: business.followUpDate ? business.followUpDate.toISOString().slice(0, 10) : "",
              leadSource: business.leadSource,
            }}
          />
        </CardBody>
      </Card>
    </div>
  );
}
