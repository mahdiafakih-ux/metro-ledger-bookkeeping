import Link from "next/link";
import {
  Target,
  DollarSign,
  CalendarDays,
  CalendarCheck,
  Building2,
  UserPlus,
  Clock,
  FileWarning,
  ArrowRight,
  MapPin,
  Video,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge, STATUS_TONES } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { RevenueChart } from "@/components/admin/charts/revenue-chart";
import { getDashboardStats, getMonthlyRevenueSeries } from "@/lib/queries/dashboard";
import { formatCents } from "@/lib/money";
import { formatDateTime, titleCase } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [stats, revenueSeries] = await Promise.all([getDashboardStats(), getMonthlyRevenueSeries(6)]);
  const { goalStats } = stats;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Dashboard</h1>
          <p className="mt-1 text-sm text-navy-400">Here&apos;s how Notar-E Services is performing.</p>
        </div>
        <Link href="/admin/goal" className="flex items-center gap-1.5 text-sm font-semibold text-accent-600 hover:text-accent-700">
          View full goal tracker <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Goal progress hero */}
      <Card className="overflow-hidden">
        <div className="bg-navy-950 p-6 text-white sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-accent-300">$50,000 Goal Progress</p>
              <p className="mt-2 text-3xl font-extrabold sm:text-4xl">{formatCents(goalStats.earnedCents, { showCents: false })}</p>
              <p className="mt-1 text-sm text-navy-300">of {formatCents(goalStats.goalAmountCents, { showCents: false })} goal</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold text-accent-300">{goalStats.percentComplete.toFixed(1)}%</p>
              <Badge tone={goalStats.paceStatus === "ahead" ? "green" : goalStats.paceStatus === "behind" ? "red" : "blue"} className="mt-1">
                {goalStats.paceStatus === "ahead" ? "Ahead of Pace" : goalStats.paceStatus === "behind" ? "Behind Pace" : goalStats.paceStatus === "on_track" ? "On Track" : "Getting Started"}
              </Badge>
            </div>
          </div>
          <ProgressBar percent={goalStats.percentComplete} className="mt-5" trackClassName="bg-navy-800" />
          <div className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div><p className="text-navy-400">Days Remaining</p><p className="font-bold">{goalStats.daysRemaining}</p></div>
            <div><p className="text-navy-400">Monthly Target</p><p className="font-bold">{formatCents(goalStats.monthlyTargetCents, { showCents: false })}</p></div>
            <div><p className="text-navy-400">Remaining</p><p className="font-bold">{formatCents(goalStats.remainingCents, { showCents: false })}</p></div>
            <div><p className="text-navy-400">Appointments Needed</p><p className="font-bold">{goalStats.appointmentsNeeded}</p></div>
          </div>
        </div>
      </Card>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Revenue This Month" value={formatCents(stats.revenueThisMonthCents, { showCents: false })} icon={DollarSign} tone="accent" />
        <StatCard label="Revenue This Week" value={formatCents(stats.revenueThisWeekCents, { showCents: false })} icon={DollarSign} tone="success" />
        <StatCard label="Appointments Today" value={String(stats.appointmentsToday)} icon={CalendarDays} />
        <StatCard label="Appointments This Month" value={String(stats.appointmentsThisMonth)} icon={CalendarCheck} />
        <StatCard label="Active Business Clients" value={String(stats.activeBusinessClients)} icon={Building2} />
        <StatCard label="New Leads" value={String(stats.newLeadsCount)} icon={UserPlus} tone="warning" />
        <StatCard label="Follow-Ups Due" value={String(stats.followUpsDue)} icon={Clock} tone="warning" />
        <StatCard label="Outstanding Invoices" value={String(stats.outstandingInvoices)} icon={FileWarning} tone="danger" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Monthly Revenue</CardTitle></CardHeader>
          <CardBody>
            <RevenueChart data={revenueSeries} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {stats.upcomingAppointments.length === 0 ? (
              <div className="p-5"><EmptyState title="No upcoming appointments" /></div>
            ) : (
              <ul className="divide-y divide-navy-100">
                {stats.upcomingAppointments.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 p-4">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-600">
                      {a.type === "remote" ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy-900">{a.clientName}</p>
                      <p className="text-xs text-navy-400">{a.serviceType} · {formatDateTime(a.scheduledStart)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardBody className="p-0">
          {stats.recentAppointments.length === 0 ? (
            <div className="p-5"><EmptyState title="No recent activity yet" /></div>
          ) : (
            <ul className="divide-y divide-navy-100">
              {stats.recentAppointments.map((a) => (
                <li key={a.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-semibold text-navy-900">{a.clientName} — {a.serviceType}</p>
                    <p className="text-xs text-navy-400">{formatDateTime(a.createdAt)}</p>
                  </div>
                  <Badge tone={STATUS_TONES[a.status] ?? "neutral"}>{titleCase(a.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
