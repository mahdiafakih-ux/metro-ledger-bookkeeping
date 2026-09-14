import { prisma } from "@/lib/db";
import { requireClientSession } from "@/lib/client-auth";
import { formatCents } from "@/lib/money";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Payments" };

export default async function PaymentsPage() {
  const session = await requireClientSession();
  if (!session) return null;

  const payments = await prisma.payment.findMany({
    where: {
      OR: [
        { appointment: { clientId: session.clientId } },
        { invoice: { clientId: session.clientId } },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: { appointment: true, invoice: true },
  });

  const statusColors = {
    succeeded: "text-success-600",
    pending: "text-warning-600",
    failed: "text-danger-600",
    refunded: "text-navy-600",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-navy-900">Payment History</h1>
        <p className="mt-2 text-navy-600">View all your payments and transactions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Payments ({payments.length})</CardTitle>
        </CardHeader>
        <CardBody>
          {payments.length > 0 ? (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {payments.map((pmt: any) => {
                const statusKey = pmt.status as keyof typeof statusColors;
                const description = pmt.appointment
                  ? `${pmt.appointment.serviceType} - ${pmt.appointment.confirmationNumber}`
                  : pmt.invoice
                  ? `Invoice ${pmt.invoice.invoiceNumber}`
                  : "Payment";

                return (
                  <div key={pmt.id} className="flex items-center justify-between rounded-lg border border-navy-100 p-4">
                    <div className="flex-1">
                      <p className="font-medium text-navy-900">{description}</p>
                      <p className="text-sm text-navy-600">
                        {new Date(pmt.createdAt).toLocaleDateString()} •{" "}
                        <span className="capitalize">{pmt.method}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-navy-900">{formatCents(pmt.amountCents)}</p>
                      <p className={`text-xs font-semibold ${statusColors[statusKey]}`}>
                        {pmt.status.charAt(0).toUpperCase() + pmt.status.slice(1)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-navy-600 py-8">No payments yet</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
