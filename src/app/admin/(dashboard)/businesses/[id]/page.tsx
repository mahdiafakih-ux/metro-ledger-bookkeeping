import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, STATUS_TONES } from "@/components/ui/badge";
import { BusinessForm } from "@/components/admin/business-form";
import { formatCents } from "@/lib/money";
import { BUSINESS_CATEGORY_LABELS } from "@/lib/constants";
import { formatDate, formatDateTime, titleCase } from "@/lib/utils";

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [business, plans] = await Promise.all([
    prisma.business.findUnique({ where: { id }, include: { appointments: { orderBy: { scheduledStart: "desc" }, take: 20 } } }),
    prisma.pricingPlan.findMany({ where: { billingPeriod: "monthly" }, select: { key: true, name: true } }),
  ]);
  if (!business) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{business.companyName}</h1>
          <p className="mt-1 text-sm text-navy-400">{BUSINESS_CATEGORY_LABELS[business.category]} · {business.contactName}</p>
        </div>
        <Badge tone={STATUS_TONES[business.status] ?? "neutral"}>{titleCase(business.status)}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4"><p className="text-xs font-semibold uppercase text-navy-400">Monthly Usage</p><p className="mt-1 text-xl font-bold text-navy-900">{business.monthlyUsage}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold uppercase text-navy-400">Monthly Revenue</p><p className="mt-1 text-xl font-bold text-navy-900">{formatCents(business.monthlyRevenueCents, { showCents: false })}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold uppercase text-navy-400">Contract Start</p><p className="mt-1 text-xl font-bold text-navy-900">{business.contractStart ? formatDate(business.contractStart) : "—"}</p></Card>
        <Card className="p-4"><p className="text-xs font-semibold uppercase text-navy-400">Renewal</p><p className="mt-1 text-xl font-bold text-navy-900">{business.renewalDate ? formatDate(business.renewalDate) : "—"}</p></Card>
      </div>

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
              packageKey: business.packageKey,
              monthlyUsage: business.monthlyUsage,
              monthlyRevenueDollars: business.monthlyRevenueCents / 100,
              status: business.status,
              contractStart: business.contractStart ? business.contractStart.toISOString().slice(0, 10) : "",
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
