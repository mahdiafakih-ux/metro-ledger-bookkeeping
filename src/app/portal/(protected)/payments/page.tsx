import Link from "next/link";
import { Receipt } from "lucide-react";
import { prisma } from "@/lib/db";
import { getPortalAccount, paymentScope } from "@/lib/portal/account";
import { paymentMethodLabel, paymentStatus } from "@/lib/portal/present";
import { formatCents } from "@/lib/money";
import { formatDetroitDate } from "@/lib/tz";
import { EmptyState, PageHeader, Panel, StatusPill } from "@/components/portal/ui";

export const metadata = { title: "Payments" };

export default async function PaymentsPage() {
  const account = await getPortalAccount();

  // Only non-sensitive fields are selected — no Stripe IDs or card data.
  const payments = await prisma.payment.findMany({
    where: paymentScope(account),
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      amountCents: true,
      method: true,
      status: true,
      paidAt: true,
      createdAt: true,
      invoice: { select: { id: true, invoiceNumber: true, status: true } },
      appointment: { select: { id: true, confirmationNumber: true, serviceType: true } },
    },
  });

  const totalPaid = payments.filter((p) => p.status === "succeeded").reduce((s, p) => s + p.amountCents, 0);

  return (
    <div className="portal-enter space-y-6">
      <PageHeader
        title="Payments"
        description={
          payments.length ? (
            <>
              <span className="tabular font-semibold text-navy-900">{formatCents(totalPaid)}</span> paid across {payments.filter((p) => p.status === "succeeded").length} payment
              {payments.filter((p) => p.status === "succeeded").length === 1 ? "" : "s"}.
            </>
          ) : (
            "Your payment history."
          )
        }
      />

      <Panel className="overflow-hidden">
        {payments.length === 0 ? (
          <EmptyState icon={Receipt} title="No payments yet" description="Payments you make for appointments and invoices will appear here." />
        ) : (
          <ul className="divide-y divide-navy-100">
            {payments.map((p) => {
              const at = p.paidAt ?? p.createdAt;
              const related = p.invoice
                ? { label: `Invoice ${p.invoice.invoiceNumber}`, href: `/invoice/${p.invoice.id}` }
                : p.appointment
                ? { label: `${p.appointment.serviceType} · ${p.appointment.confirmationNumber}`, href: `/portal/appointments/${p.appointment.id}` }
                : null;
              return (
                <li key={p.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-navy-950">
                      {related ? (
                        <Link href={related.href} className="hover:text-accent-700">
                          {related.label}
                        </Link>
                      ) : (
                        "Payment"
                      )}
                    </p>
                    <p className="tabular text-xs text-navy-500">
                      {formatDetroitDate(at)} · {paymentMethodLabel(p.method)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <StatusPill status={paymentStatus(p.status)} />
                    <p className={`tabular w-24 text-right text-sm font-semibold ${p.status === "refunded" ? "text-navy-400 line-through" : "text-navy-950"}`}>
                      {formatCents(p.amountCents)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
