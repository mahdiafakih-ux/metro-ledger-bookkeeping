import { prisma } from "@/lib/db";
import { getClientSession } from "@/lib/client-auth";
import { getBusinessSettings } from "@/lib/settings";
import { formatCents } from "@/lib/money";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Calendar, FileText, CreditCard } from "lucide-react";

export const metadata = {
  title: "Portal Dashboard",
};

export default async function PortalDashboard() {
  const session = await getClientSession();
  if (!session) {
    return <div>Not authenticated</div>;
  }

  const client = await prisma.client.findUnique({
    where: { id: session.clientId },
    include: {
      appointments: {
        where: { status: { not: "cancelled" } },
        orderBy: { scheduledStart: "desc" },
        take: 5,
      },
      invoices: {
        orderBy: { issueDate: "desc" },
        take: 5,
      },
    },
  });

  if (!client) {
    return <div>Client not found</div>;
  }

  const settings = await getBusinessSettings();
  const isPaid = client.amountOwedCents === 0;

  // Determine plan type
  let planDisplay = {
    name: "Pay Per Appointment",
    price: "$125",
    period: "per appointment",
    details: [] as string[],
    showUsage: false,
  };

  if (client.currentPlanKey === "business30") {
    const includedAppointments = settings.business30IncludedAppointments;
    const overageCount = Math.max(0, client.monthlyUsageCount - includedAppointments);
    const details: string[] = [
      `Monthly Usage: ${client.monthlyUsageCount} / ${includedAppointments} appointments`,
      `Remaining: ${Math.max(0, includedAppointments - client.monthlyUsageCount)}`,
    ];
    if (overageCount > 0) details.push(`Overage Appointments: ${overageCount} × $50`);
    if (client.nextBillingDate) details.push(`Next Billing: ${new Date(client.nextBillingDate).toLocaleDateString()}`);

    planDisplay = {
      name: "Business 30",
      price: "$2,500",
      period: "per month",
      details,
      showUsage: true,
    };
  } else if (client.currentPlanKey === "unlimited") {
    planDisplay = {
      name: "Business Unlimited",
      price: "$4,000",
      period: "per month",
      details: [
        "Unlimited appointments",
        client.nextBillingDate ? `Next Billing: ${new Date(client.nextBillingDate).toLocaleDateString()}` : "",
      ].filter(Boolean) as string[],
      showUsage: false,
    };
  }

  // Calculate statistics
  const upcomingAppointments = client.appointments.filter(
    (a: any) => new Date(a.scheduledStart) > new Date()
  );
  const outstandingBalance = client.amountOwedCents;
  const totalUnpaidInvoices = client.invoices.filter(
    (i) => i.status !== "paid"
  ).length;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-navy-900">
          Welcome back, {client.name.split(" ")[0]}!
        </h1>
        <p className="mt-2 text-navy-600">
          Manage your notary service appointments and billing below.
        </p>
      </div>

      {/* Current Plan Card */}
      <Card className="border-2 border-accent-400 bg-accent-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Plan</span>
            <span className="text-lg font-semibold text-accent-600">
              {planDisplay.name}
            </span>
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-navy-600">Price</p>
              <p className="text-2xl font-bold text-navy-900">
                {planDisplay.price}
                <span className="text-sm font-normal text-navy-600 ml-1">
                  {planDisplay.period}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-navy-600">Status</p>
              <p className="text-lg font-semibold text-success-600">
                {client.subscriptionStatus || "Active"}
              </p>
            </div>
            {planDisplay.details.map((detail, idx) => (
              <div key={idx} className="sm:col-span-1">
                <p className="text-sm text-navy-700">{detail}</p>
              </div>
            ))}
            {client.currentPlanKey !== "individual" && (
              <div className="sm:col-span-2">
                <Link href="/portal/billing">
                  <Button className="w-full" variant="outline">
                    Manage Billing
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-navy-600">Upcoming Appointments</p>
                <p className="text-3xl font-bold text-navy-900">
                  {upcomingAppointments.length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-accent-500 opacity-50" />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-navy-600">Outstanding Balance</p>
                <p className="text-3xl font-bold text-navy-900">
                  {formatCents(outstandingBalance)}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-warning-500 opacity-50" />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-navy-600">Unpaid Invoices</p>
                <p className="text-3xl font-bold text-navy-900">
                  {totalUnpaidInvoices}
                </p>
              </div>
              <FileText className="h-8 w-8 text-danger-500 opacity-50" />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-navy-600">Total Appointments</p>
                <p className="text-3xl font-bold text-navy-900">
                  {client.totalAppointments}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-success-500 opacity-50" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Upcoming Appointments</span>
            <Link href="/portal/appointments">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardBody>
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.map((apt: any) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between rounded-lg border border-navy-100 p-4"
                >
                  <div>
                    <p className="font-medium text-navy-900">
                      {apt.serviceType}
                    </p>
                    <p className="text-sm text-navy-600">
                      {new Date(apt.scheduledStart).toLocaleDateString()} at{" "}
                      {new Date(apt.scheduledStart).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-navy-700">
                    {apt.confirmationNumber}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-navy-600 py-8">
              No upcoming appointments
            </p>
          )}
        </CardBody>
      </Card>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Invoices</span>
            <Link href="/portal/invoices">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardBody>
          {client.invoices.length > 0 ? (
            <div className="space-y-3">
              {client.invoices.slice(0, 3).map((inv: any) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-lg border border-navy-100 p-4"
                >
                  <div>
                    <p className="font-medium text-navy-900">{inv.invoiceNumber}</p>
                    <p className="text-sm text-navy-600">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-navy-900">
                      {formatCents(inv.items.reduce((sum: number, i: any) => sum + i.amountCents, 0) + inv.taxCents)}
                    </p>
                    <p className={`text-xs font-medium ${
                      inv.status === "paid" ? "text-success-600" : "text-warning-600"
                    }`}>
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-navy-600 py-8">
              No invoices yet
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
