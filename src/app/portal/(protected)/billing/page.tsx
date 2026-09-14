import { prisma } from "@/lib/db";
import { requireClientSession } from "@/lib/client-auth";
import { getBusinessSettings } from "@/lib/settings";
import { formatCents } from "@/lib/money";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { BillingClient } from "@/components/portal/billing-client";

export const metadata = { title: "Billing" };

export default async function BillingPage() {
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

  const settings = await getBusinessSettings();

  // Get current plan details
  let planInfo = {
    name: "Individual Service",
    price: "$125",
    period: "per appointment",
    status: "active" as const,
    nextBillingDate: null as Date | null,
    usage: null as { current: number; limit: number } | null,
  };

  if (client.currentPlanKey === "business30") {
    planInfo = {
      name: "Business 30",
      price: "$2,500",
      period: "per month",
      status: (client.subscriptionStatus as any) || "active",
      nextBillingDate: client.nextBillingDate,
      usage: {
        current: client.monthlyUsageCount,
        limit: settings.business30IncludedAppointments,
      },
    };
  } else if (client.currentPlanKey === "unlimited") {
    planInfo = {
      name: "Business Unlimited",
      price: "$4,000",
      period: "per month",
      status: (client.subscriptionStatus as any) || "active",
      nextBillingDate: client.nextBillingDate,
      usage: null,
    };
  }

  // Calculate totals
  const unpaidInvoices = client.invoices.filter((i: any) => i.status !== "paid");
  const totalOutstanding = unpaidInvoices.reduce((sum: number, inv: any) => {
    const total = inv.items.reduce((s: number, item: any) => s + item.amountCents, 0) + inv.taxCents;
    return sum + (total - inv.amountPaidCents);
  }, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-navy-900">Billing & Subscriptions</h1>
        <p className="mt-2 text-navy-600">Manage your payment methods and subscription</p>
      </div>

      {/* Current Plan */}
      <Card className="border-2 border-accent-400 bg-accent-50">
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-sm text-navy-600">Plan</p>
              <p className="text-xl font-bold text-navy-900">{planInfo.name}</p>
            </div>
            <div>
              <p className="text-sm text-navy-600">Price</p>
              <p className="text-xl font-bold text-navy-900">
                {planInfo.price}
                <span className="text-sm font-normal text-navy-600 ml-1">
                  {planInfo.period}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-navy-600">Status</p>
              <p className="text-xl font-bold text-success-600 capitalize">
                {planInfo.status}
              </p>
            </div>
            {planInfo.nextBillingDate && (
              <div className="sm:col-span-3">
                <p className="text-sm text-navy-600">Next Billing Date</p>
                <p className="text-lg font-semibold text-navy-900">
                  {planInfo.nextBillingDate.toLocaleDateString()}
                </p>
              </div>
            )}
            {planInfo.usage && (
              <div className="sm:col-span-3">
                <p className="text-sm text-navy-600 mb-2">Monthly Usage</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-2 bg-navy-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-500"
                        style={{
                          width: `${Math.min(100, (planInfo.usage.current / planInfo.usage.limit) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-navy-900 whitespace-nowrap">
                    {planInfo.usage.current} / {planInfo.usage.limit}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Stripe Portal Button */}
      {client.stripeCustomerId && (
        <BillingClient client={client} />
      )}

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
              {client.invoices.slice(0, 5).map((inv: any) => {
                const total = inv.items.reduce((sum: number, i: any) => sum + i.amountCents, 0) + inv.taxCents;
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
