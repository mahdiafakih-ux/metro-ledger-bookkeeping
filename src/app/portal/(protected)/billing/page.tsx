import { prisma } from "@/lib/db";
import { requireClientSession } from "@/lib/client-auth";
import Link from "next/link";
import { getPortalBusinesses } from "@/lib/portal-billing";
import { PlanPicker } from "@/components/portal/plan-picker";
import { formatCents } from "@/lib/money";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { BillingClient } from "@/components/portal/billing-client";

export const metadata = { title: "Billing" };

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ session_id?: string; cancelled?: string }> }) {
  const session = await requireClientSession();
  if (!session) return null;

  const client = await prisma.client.findUnique({
    where: { id: session.clientId },
    include: {
      invoices: {
        orderBy: { issueDate: "desc" },
        include: { items: true },
      },
    },
  });

  if (!client) return null;

  const businesses = await getPortalBusinesses(client.id);
  const individual = await prisma.pricingPlan.findUnique({ where: { key: "individual" } });
  const sp = await searchParams;
  const manageableIds = businesses.filter((b) => b.canManage).map((b) => b.businessId);
  const businessInvoices = manageableIds.length
    ? await prisma.invoice.findMany({
        where: { businessId: { in: manageableIds }, status: { in: ["sent", "overdue", "partially_paid"] } },
        include: { items: true },
        orderBy: { issueDate: "desc" },
      })
    : [];

  // Calculate totals
  const unpaidInvoices = client.invoices.filter((i) => i.status !== "paid" && i.status !== "cancelled");
  const totalOutstanding = unpaidInvoices.reduce((sum, inv) => {
    const total = inv.items.reduce((s, item) => s + item.amountCents, 0) + inv.taxCents;
    return sum + (total - inv.amountPaidCents);
  }, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-navy-900">Billing &amp; Plans</h1>
        <p className="mt-2 text-navy-600">Your plan, usage and invoices in one place.</p>
      </div>

      {sp.session_id && (
        <div className="rounded-xl border border-success-100 bg-success-100/60 p-4 text-sm font-medium text-success-600">
          Payment received — your plan activates as soon as Stripe confirms it (usually within a minute).
        </div>
      )}
      {sp.cancelled && (
        <div className="rounded-xl border border-navy-100 bg-white p-4 text-sm text-navy-600">Checkout cancelled. No charge was made.</div>
      )}

      {businesses.map((b) => (
        <Card key={b.businessId} className="overflow-hidden">
          <CardHeader className="flex flex-col gap-2 border-b border-navy-100 bg-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{b.companyName}</p>
              <CardTitle className="text-xl">{b.hasActiveSubscription ? b.planName : "No active plan"}</CardTitle>
            </div>
            {b.subscriptionStatus && (
              <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${b.subscriptionStatus === "active" ? "bg-success-100 text-success-600" : "bg-warning-100 text-warning-600"}`}>
                {b.subscriptionStatus.replace("_", " ")}
              </span>
            )}
          </CardHeader>
          <CardBody className="space-y-6">
            {b.isLegacyPlan && (
              <p className="rounded-lg bg-warning-100 p-3 text-sm text-warning-600">
                Business Unlimited has been discontinued. Your current subscription continues as-is; you can switch to Business10 or Business30 at any time.
              </p>
            )}

            {b.usage && (
              <div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-navy-500">Notarizations this billing month</p>
                    <p className="text-3xl font-extrabold text-navy-900">
                      {b.usage.used}
                      <span className="text-lg font-semibold text-navy-400"> / {b.usage.included}</span>
                    </p>
                  </div>
                  <p className="text-right text-xs text-navy-400">
                    Resets {b.usage.periodEnd.toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-navy-100">
                  <div
                    className={`h-full rounded-full ${b.usage.overageUnits > 0 ? "bg-warning-500" : "bg-accent-500"}`}
                    style={{ width: `${Math.min(100, (b.usage.used / Math.max(1, b.usage.included)) * 100)}%` }}
                  />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-navy-50 p-3"><p className="text-xs text-navy-500">Remaining</p><p className="text-lg font-bold text-navy-900">{b.usage.remaining}</p></div>
                  <div className="rounded-xl bg-navy-50 p-3"><p className="text-xs text-navy-500">Extra ($75 ea)</p><p className="text-lg font-bold text-navy-900">{b.usage.overageUnits}</p></div>
                  <div className="rounded-xl bg-navy-50 p-3"><p className="text-xs text-navy-500">Est. this month</p><p className="text-lg font-bold text-navy-900">{formatCents(b.usage.projectedTotalCents, { showCents: false })}</p></div>
                </div>
              </div>
            )}

            {businessInvoices.filter((inv) => inv.businessId === b.businessId).length > 0 && (
              <div className="rounded-xl border border-warning-100 bg-warning-100/40 p-4">
                <p className="text-sm font-semibold text-navy-900">Open invoices</p>
                <ul className="mt-2 space-y-2">
                  {businessInvoices.filter((inv) => inv.businessId === b.businessId).map((inv) => {
                    const due = inv.items.reduce((sum, i) => sum + i.amountCents, 0) + inv.taxCents - inv.amountPaidCents;
                    return (
                      <li key={inv.id} className="flex items-center justify-between text-sm">
                        <span className="text-navy-700">{inv.invoiceNumber}</span>
                        <Link href={`/invoice/${inv.id}`} className="font-semibold text-accent-600 hover:text-accent-700">
                          Pay {formatCents(due)} →
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {b.canManage ? (
              <>
                <PlanPicker businessId={b.businessId} currentPlanKey={b.planKey} hasActiveSubscription={b.hasActiveSubscription} />
                {b.hasStripeCustomer && <BillingClient businessId={b.businessId} />}
              </>
            ) : (
              <p className="text-sm text-navy-500">Only your company&apos;s account owner or admin can change the plan.</p>
            )}
          </CardBody>
        </Card>
      ))}

      {businesses.length === 0 && (
        <Card>
          <CardBody className="grid gap-6 sm:grid-cols-2 sm:items-center">
            <div>
              <p className="text-sm text-navy-500">Your plan</p>
              <p className="text-2xl font-bold text-navy-900">Pay per appointment</p>
              {individual && (
                <p className="mt-1 text-sm text-navy-500">
                  {formatCents(individual.totalCents, { showCents: false })} per appointment · includes the $10 statutory notarial fee
                </p>
              )}
            </div>
            <div className="rounded-xl bg-navy-50 p-4 text-sm text-navy-600">
              <p className="font-semibold text-navy-900">Booking for a business?</p>
              <p className="mt-1">Business10 ($1,000/mo) and Business30 ($3,000/mo) include monthly notarizations and one invoice.</p>
              <Link href="/business-solutions" className="mt-2 inline-block font-semibold text-accent-600 hover:text-accent-700">See business plans →</Link>
            </div>
          </CardBody>
        </Card>
      )}

      {client.stripeCustomerId && <BillingClient client={client} label="Personal billing" />}

      {/* Outstanding Balance */}
      {totalOutstanding > 0 && (
        <Card className="border-warning-200 bg-warning-50">
          <CardHeader>
            <CardTitle className="text-warning-900">Outstanding Balance</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-2xl font-bold text-warning-700">
              {formatCents(totalOutstanding)}
            </p>
            <p className="mt-2 text-sm text-warning-600">
              {unpaidInvoices.length} invoice{unpaidInvoices.length !== 1 ? "s" : ""} awaiting payment
            </p>
          </CardBody>
        </Card>
      )}

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardBody>
          {client.invoices.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {client.invoices.slice(0, 5).map((inv) => {
                const total = inv.items.reduce((sum, i) => sum + i.amountCents, 0) + inv.taxCents;
                const outstanding = total - inv.amountPaidCents;
                return (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-lg border border-navy-100 p-3"
                  >
                    <div>
                      <p className="font-medium text-navy-900">{inv.invoiceNumber}</p>
                      <p className="text-xs text-navy-600">
                        {new Date(inv.issueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-navy-900">{formatCents(total)}</p>
                      {outstanding > 0 ? (
                        <p className="text-xs font-medium text-danger-600">
                          {formatCents(outstanding)} due
                        </p>
                      ) : (
                        <p className="text-xs font-medium text-success-600">Paid</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-navy-600 py-8">No invoices yet</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
