import Link from "next/link";
import { Rocket, CalendarClock, Clock, Target, DollarSign, PhoneCall, ArrowRight, MapPin, Video } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, STATUS_TONES } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { getDashboardStats } from "@/lib/queries/dashboard";
import { formatCents } from "@/lib/money";
import { formatTime, titleCase } from "@/lib/utils";

function startOfDay(d = new Date()) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function endOfDay(d = new Date()) { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; }

export default async function CommandCenterPage() {
  const now = new Date();
  const stats = await getDashboardStats();

  const [todayAppointments, followUpsToday, openProspects, todayScorecard, todayRevenueAgg] = await Promise.all([
    prisma.appointment.findMany({
      where: { scheduledStart: { gte: startOfDay(now), lte: endOfDay(now) }, status: { not: "cancelled" } },
      orderBy: { scheduledStart: "asc" },
    }),
    prisma.client.findMany({ where: { followUpDate: { lte: endOfDay(now) } }, take: 8 }),
    prisma.pipelineOpportunity.findMany({ where: { stage: { notIn: ["won", "lost"] } }, orderBy: { probability: "desc" }, take: 6 }),
    prisma.scorecardEntry.findUnique({ where: { date: startOfDay(now) } }),
    prisma.revenueEntry.aggregate({ where: { date: { gte: startOfDay(now), lte: endOfDay(now) } }, _sum: { amountCents: true } }),
  ]);

  const dailyRevenueTarget = stats.goalStats.monthlyTargetCents / 30.44;
  const todayRevenueCents = todayRevenueAgg._sum.amountCents ?? 0;

  const missions: string[] = [];
  if (todayAppointments.filter((a) => a.status === "scheduled").length > 0) {
    missions.push(`Complete ${todayAppointments.filter((a) => a.status === "scheduled").length} appointment(s) today`);
  }
  if (followUpsToday.length > 0) missions.push(`Follow up with ${followUpsToday.length} client(s)`);
  if ((todayScorecard?.calls ?? 0) < stats.settings.targetCalls) {
    missions.push(`Make ${stats.settings.targetCalls - (todayScorecard?.calls ?? 0)} more calls to hit today's target`);
  }
  if (openProspects.length > 0) missions.push(`Move ${openProspects[0].businessName} forward in the pipeline`);
  if (missions.length === 0) missions.push("You're all caught up — great work! Log some outreach to keep building.");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-accent-600">
          {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="text-2xl font-bold text-navy-900">Notar-E Command Center</h1>
      </div>

      <Card className="overflow-hidden">
        <div className="bg-navy-950 p-6 text-white sm:p-8">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-accent-300" />
            <p className="text-sm font-bold uppercase tracking-widest text-accent-300">Today&apos;s Mission</p>
          </div>
          <ul className="mt-4 space-y-2">
            {missions.map((m) => (
              <li key={m} className="flex items-start gap-2.5 text-navy-100">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
                {m}
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase text-navy-400">Revenue Target Today</p>
          <p className="mt-1 text-xl font-bold text-navy-900">{formatCents(dailyRevenueTarget, { showCents: false })}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase text-navy-400">Revenue Earned Today</p>
          <p className="mt-1 text-xl font-bold text-success-600">{formatCents(todayRevenueCents, { showCents: false })}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase text-navy-400">Outreach Today</p>
          <p className="mt-1 text-xl font-bold text-navy-900">{(todayScorecard?.calls ?? 0) + (todayScorecard?.emails ?? 0)} / {stats.settings.targetCalls + stats.settings.targetEmails}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase text-navy-400">Goal Progress</p>
          <p className="mt-1 text-xl font-bold text-navy-900">{stats.goalStats.percentComplete.toFixed(1)}%</p>
          <ProgressBar percent={stats.goalStats.percentComplete} className="mt-2" animate={false} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><CalendarClock className="h-4 w-4" /> Today&apos;s Appointments</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {todayAppointments.length === 0 ? (
              <div className="p-5"><EmptyState title="No appointments today" /></div>
            ) : (
              <ul className="divide-y divide-navy-100">
                {todayAppointments.map((a) => (
                  <li key={a.id}>
                    <Link href={`/admin/appointments/${a.id}`} className="flex items-center gap-3 p-4 hover:bg-navy-50">
                      {a.type === "remote" ? <Video className="h-4 w-4 text-navy-400" /> : <MapPin className="h-4 w-4 text-navy-400" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-navy-900">{formatTime(a.scheduledStart)} — {a.clientName}</p>
                        <p className="text-xs text-navy-400">{a.serviceType}</p>
                      </div>
                      <Badge tone={STATUS_TONES[a.status] ?? "neutral"}>{titleCase(a.status)}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4" /> Follow-Ups Due</CardTitle></CardHeader>
          <CardBody className="p-0">
            {followUpsToday.length === 0 ? (
              <div className="p-5"><EmptyState title="No follow-ups due" /></div>
            ) : (
              <ul className="divide-y divide-navy-100">
                {followUpsToday.map((c) => (
                  <li key={c.id}>
                    <Link href={`/admin/clients/${c.id}`} className="flex items-center justify-between p-4 hover:bg-navy-50">
                      <p className="text-sm font-semibold text-navy-900">{c.name}</p>
                      <span className="text-xs text-navy-400">{c.phone || c.email}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-4 w-4" /> Sales Prospects</CardTitle></CardHeader>
          <CardBody className="p-0">
            {openProspects.length === 0 ? (
              <div className="p-5"><EmptyState title="No open prospects" /></div>
            ) : (
              <ul className="divide-y divide-navy-100">
                {openProspects.map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/pipeline/${p.id}`} className="flex items-center justify-between p-4 hover:bg-navy-50">
                      <div>
                        <p className="text-sm font-semibold text-navy-900">{p.businessName}</p>
                        <p className="text-xs text-navy-400">{titleCase(p.stage)}</p>
                      </div>
                      <span className="text-xs font-semibold text-accent-600">{p.probability}%</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <PhoneCall className="h-5 w-5 text-accent-600" />
            <p className="text-sm text-navy-600">Ready to grow? Log today&apos;s outreach and keep your streak alive.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/outreach" className="text-sm font-semibold text-accent-600 hover:text-accent-700">Log Outreach →</Link>
            <Link href="/admin/scorecard" className="text-sm font-semibold text-accent-600 hover:text-accent-700">View Scorecard →</Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
