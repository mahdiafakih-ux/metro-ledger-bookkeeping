import { prisma } from "@/lib/db";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardBody } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { OutreachQuickAdd } from "@/components/admin/outreach-quick-add";
import { OutreachTable } from "@/components/admin/outreach-table";
import { Phone, Mail, Clock, CalendarCheck, Trophy, TrendingUp, Users, Download, Flame, Target, DollarSign } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { getOutreachStreaks, getRevenueGeneratedFromOutreachCents } from "@/lib/queries/outreach";
import { getBusinessSettings } from "@/lib/settings";
import { formatCents } from "@/lib/money";

function startOfDay(d = new Date()) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function endOfDay(d = new Date()) { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; }
function startOfWeek(d = new Date()) { const x = new Date(d); x.setDate(x.getDate() - x.getDay()); x.setHours(0, 0, 0, 0); return x; }

export default async function OutreachPage() {
  const now = new Date();
  const settings = await getBusinessSettings();
  const dailyTarget = settings.targetBusinessesContacted;
  const weeklyTarget = dailyTarget * 7;

  const [
    rows,
    callsToday,
    emailsToday,
    contactedToday,
    contactedThisWeek,
    followUpsDue,
    meetingsBooked,
    clientsWon,
    leadsGenerated,
    total,
    streaks,
    revenueFromOutreachCents,
  ] = await Promise.all([
    prisma.outreachLog.findMany({ orderBy: { dateContacted: "desc" }, take: 200 }),
    prisma.outreachLog.count({ where: { method: "call", dateContacted: { gte: startOfDay(now), lte: endOfDay(now) } } }),
    prisma.outreachLog.count({ where: { method: "email", dateContacted: { gte: startOfDay(now), lte: endOfDay(now) } } }),
    prisma.outreachLog.count({ where: { dateContacted: { gte: startOfDay(now), lte: endOfDay(now) } } }),
    prisma.outreachLog.count({ where: { dateContacted: { gte: startOfWeek(now) } } }),
    prisma.outreachLog.count({ where: { followUpDate: { lte: endOfDay(now) } } }),
    prisma.outreachLog.count({ where: { status: "meeting_booked" } }),
    prisma.outreachLog.count({ where: { status: "won" } }),
    prisma.outreachLog.count({ where: { response: "interested" } }),
    prisma.outreachLog.count(),
    getOutreachStreaks(dailyTarget),
    getRevenueGeneratedFromOutreachCents(),
  ]);

  const conversionRate = total > 0 ? ((clientsWon / total) * 100).toFixed(1) : "0.0";
  const todayPercent = dailyTarget > 0 ? Math.min(100, (contactedToday / dailyTarget) * 100) : 0;
  const weekPercent = weeklyTarget > 0 ? Math.min(100, (contactedThisWeek / weeklyTarget) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Outreach Command Center</h1>
          <p className="mt-1 text-sm text-navy-400">Every call, email, text, and visit that grows Notar-E Services.</p>
        </div>
        <LinkButton href="/api/export/outreach" variant="outline"><Download className="h-4 w-4" /> Export CSV</LinkButton>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody className="space-y-5">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-semibold text-navy-700">Today&apos;s Progress</span>
                <span className="text-navy-400">{contactedToday} / {dailyTarget}</span>
              </div>
              <ProgressBar percent={todayPercent} />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-semibold text-navy-700">Weekly Progress</span>
                <span className="text-navy-400">{contactedThisWeek} / {weeklyTarget}</span>
              </div>
              <ProgressBar percent={weekPercent} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex h-full items-center justify-around gap-4">
            <div className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-warning-100 text-warning-600"><Flame className="h-5 w-5" /></div>
              <p className="mt-2 text-xl font-extrabold text-navy-900">{streaks.current}</p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-navy-400">Current Streak</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-accent-600"><Target className="h-5 w-5" /></div>
              <p className="mt-2 text-xl font-extrabold text-navy-900">{streaks.best}</p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-navy-400">Best Streak</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Calls Today" value={String(callsToday)} icon={Phone} />
        <StatCard label="Emails Today" value={String(emailsToday)} icon={Mail} />
        <StatCard label="Follow-Ups Due" value={String(followUpsDue)} icon={Clock} tone="warning" />
        <StatCard label="Leads Generated" value={String(leadsGenerated)} icon={Users} tone="accent" />
        <StatCard label="Meetings Booked" value={String(meetingsBooked)} icon={CalendarCheck} tone="accent" />
        <StatCard label="Deals Won" value={String(clientsWon)} icon={Trophy} tone="success" />
        <StatCard label="Conversion Rate" value={`${conversionRate}%`} icon={TrendingUp} />
        <StatCard label="Revenue From Outreach" value={formatCents(revenueFromOutreachCents, { showCents: false })} icon={DollarSign} tone="success" />
      </div>

      <OutreachQuickAdd />

      {rows.length === 0 ? (
        <EmptyState title="No outreach logged yet" description="Use the form above to log your first call, email, or visit." />
      ) : (
        <Card className="overflow-hidden">
          <OutreachTable rows={rows} />
        </Card>
      )}
    </div>
  );
}
