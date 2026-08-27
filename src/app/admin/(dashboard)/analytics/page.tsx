import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { RevenueChart } from "@/components/admin/charts/revenue-chart";
import { SimpleBarChart } from "@/components/admin/charts/bar-chart";
import { DonutChart } from "@/components/admin/charts/donut-chart";
import { BarList } from "@/components/admin/charts/bar-list";
import { ProgressBar } from "@/components/ui/progress-bar";
import { TrendingUp, Users, Repeat, Target, DollarSign, Percent } from "lucide-react";
import { getMonthlyRevenueSeries, getDashboardStats } from "@/lib/queries/dashboard";
import { getCumulativeRevenueSeries } from "@/lib/queries/goal";
import {
  getMonthlyAppointmentsSeries,
  getNewClientsSeries,
  getRevenueByService,
  getRevenueByPricingPlan,
  getRevenueByClient,
  getRevenueByCompany,
  getRecurringRevenueCents,
  getAverageAppointmentValueCents,
  getSalesConversion,
  getClientAcquisitionCount,
} from "@/lib/queries/analytics";
import { formatCents } from "@/lib/money";

export default async function AnalyticsPage() {
  const [
    dashboardStats,
    monthlyRevenue,
    cumulativeRevenue,
    monthlyAppointments,
    newClients,
    revenueByService,
    revenueByPlan,
    revenueByClient,
    revenueByCompany,
    recurringRevenueCents,
    avgAppointmentCents,
    salesConversion,
    newClientsThisMonth,
  ] = await Promise.all([
    getDashboardStats(),
    getMonthlyRevenueSeries(6),
    getCumulativeRevenueSeries(6),
    getMonthlyAppointmentsSeries(6),
    getNewClientsSeries(6),
    getRevenueByService(),
    getRevenueByPricingPlan(),
    getRevenueByClient(),
    getRevenueByCompany(),
    getRecurringRevenueCents(),
    getAverageAppointmentValueCents(),
    getSalesConversion(),
    getClientAcquisitionCount(30),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Analytics</h1>
        <p className="mt-1 text-sm text-navy-400">Deep performance insight across revenue, clients, and sales.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Recurring Monthly Revenue" value={formatCents(recurringRevenueCents, { showCents: false })} icon={Repeat} tone="accent" />
        <StatCard label="Avg Appointment Value" value={formatCents(avgAppointmentCents, { showCents: false })} icon={DollarSign} />
        <StatCard label="New Clients (30d)" value={String(newClientsThisMonth)} icon={Users} />
        <StatCard label="Sales Conversion" value={`${salesConversion.toFixed(1)}%`} icon={Percent} />
        <StatCard label="Goal Progress" value={`${dashboardStats.goalStats.percentComplete.toFixed(1)}%`} icon={Target} tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Monthly Revenue</CardTitle></CardHeader>
          <CardBody><RevenueChart data={monthlyRevenue} /></CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Goal Progress (Cumulative)</CardTitle></CardHeader>
          <CardBody>
            <RevenueChart data={cumulativeRevenue.map((c) => ({ label: c.label, revenueCents: c.cumulativeCents }))} />
            <div className="mt-2">
              <ProgressBar percent={dashboardStats.goalStats.percentComplete} animate={false} />
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Appointments per Month</CardTitle></CardHeader>
          <CardBody>
            <SimpleBarChart data={monthlyAppointments.map((m) => ({ label: m.label, count: m.count }))} dataKey="count" color="#3b6bff" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>New Clients per Month</CardTitle></CardHeader>
          <CardBody>
            <SimpleBarChart data={newClients.map((m) => ({ label: m.label, count: m.count }))} dataKey="count" color="#16b364" />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Revenue by Service Type</CardTitle></CardHeader>
          <CardBody><DonutChart data={revenueByService} format="currency" /></CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Revenue by Pricing Plan</CardTitle></CardHeader>
          <CardBody><DonutChart data={revenueByPlan} format="currency" /></CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top Clients by Revenue</CardTitle></CardHeader>
          <CardBody><BarList items={revenueByClient} /></CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top Companies by Revenue</CardTitle></CardHeader>
          <CardBody><BarList items={revenueByCompany} /></CardBody>
        </Card>
      </div>

      <Card>
        <CardBody className="flex items-center gap-3 text-sm text-navy-500">
          <TrendingUp className="h-4 w-4 text-accent-600" />
          Charts reflect live data from completed appointments, active business subscriptions, and manual revenue entries.
        </CardBody>
      </Card>
    </div>
  );
}
