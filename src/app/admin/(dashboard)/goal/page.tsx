import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Users,
  Target,
  Flag,
} from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import { AddRevenueForm } from "@/components/admin/add-revenue-form";
import { MilestoneCelebration } from "@/components/admin/milestone-celebration";
import { RevenueChart } from "@/components/admin/charts/revenue-chart";
import { getDashboardStats, getMonthlyRevenueSeries } from "@/lib/queries/dashboard";
import { getCumulativeRevenueSeries } from "@/lib/queries/goal";
import { MILESTONE_CENTS } from "@/lib/goal";
import { formatCents } from "@/lib/money";
import { formatDate, cn } from "@/lib/utils";

export default async function GoalTrackerPage() {
  const [stats, revenueSeries, cumulativeSeries] = await Promise.all([
    getDashboardStats(),
    getMonthlyRevenueSeries(6),
    getCumulativeRevenueSeries(6),
  ]);
  const { goalStats, settings } = stats;

  const paceConfig = {
    ahead: { label: "Ahead of Pace", tone: "green" as const, icon: TrendingUp },
    on_track: { label: "On Track", tone: "blue" as const, icon: Minus },
    behind: { label: "Behind Pace", tone: "red" as const, icon: TrendingDown },
    no_data: { label: "Getting Started", tone: "neutral" as const, icon: Minus },
  }[goalStats.paceStatus];

  return (
    <div className="space-y-6">
      <MilestoneCelebration />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">$50,000 Goal Tracker</h1>
          <p className="mt-1 text-sm text-navy-400">Target: {formatCents(goalStats.goalAmountCents, { showCents: false })} by {formatDate(settings.goalDeadline)}</p>
        </div>
        <AddRevenueForm />
      </div>

      {/* Hero progress */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-navy-950 to-navy-900 p-8 text-white">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-accent-300">Revenue Earned</p>
              <p className="mt-2 text-5xl font-extrabold tracking-tight">{formatCents(goalStats.earnedCents, { showCents: false })}</p>
              <p className="mt-2 text-navy-300">
                {formatCents(goalStats.remainingCents, { showCents: false })} remaining of {formatCents(goalStats.goalAmountCents, { showCents: false })}
              </p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                <paceConfig.icon className="h-4 w-4 text-accent-300" />
                <span className="text-sm font-semibold">{paceConfig.label}</span>
              </div>
              <p className="mt-3 text-4xl font-extrabold text-accent-300">{goalStats.percentComplete.toFixed(1)}%</p>
              <p className="text-xs text-navy-400">complete</p>
            </div>
          </div>
          <ProgressBar percent={goalStats.percentComplete} className="mt-6" trackClassName="bg-navy-800" barClassName="h-3" />

          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Metric label="Days Remaining" value={String(goalStats.daysRemaining)} />
            <Metric label="Monthly Target" value={formatCents(goalStats.monthlyTargetCents, { showCents: false })} />
            <Metric label="Weekly Target" value={formatCents(goalStats.weeklyTargetCents, { showCents: false })} />
            <Metric
              label="Projected Completion"
              value={goalStats.projectedCompletionDate ? formatDate(goalStats.projectedCompletionDate) : "—"}
            />
          </div>
        </div>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader><CardTitle>Milestones</CardTitle></CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-3">
            {MILESTONE_CENTS.map((m) => {
              const achieved = goalStats.earnedCents >= m;
              return (
                <div
                  key={m}
                  className={cn(
                    "flex min-w-[100px] flex-1 flex-col items-center gap-1 rounded-xl border-2 p-4 text-center",
                    achieved ? "border-accent-500 bg-accent-100/40" : "border-navy-100"
                  )}
                >
                  <Flag className={cn("h-4 w-4", achieved ? "text-accent-600" : "text-navy-300")} />
                  <p className={cn("font-bold", achieved ? "text-accent-700" : "text-navy-400")}>${(m / 100).toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Detail stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Current Pace / Day" value={formatCents(goalStats.currentPaceCentsPerDay, { showCents: false })} icon={TrendingUp} />
        <StatCard label="Required Pace / Day" value={formatCents(goalStats.requiredPaceCentsPerDay, { showCents: false })} icon={Target} />
        <StatCard label="Appointments Needed" value={String(goalStats.appointmentsNeeded)} icon={Calendar} />
        <StatCard label="Recurring Clients Needed" value={String(goalStats.recurringClientsNeeded)} icon={Users} />
      </div>

      <Card className="border-accent-200 bg-accent-100/30">
        <CardBody>
          <p className="text-sm leading-relaxed text-navy-700">
            {goalStats.paceStatus === "behind" ? (
              <>
                At your current pace, you&apos;re projected to reach $50,000 on{" "}
                <strong>{goalStats.projectedCompletionDate ? formatDate(goalStats.projectedCompletionDate) : "an unknown date"}</strong> — after your {formatDate(settings.goalDeadline)} target.
                You need an additional <strong>{formatCents(Math.max(0, goalStats.requiredPaceCentsPerDay - goalStats.currentPaceCentsPerDay) * 30.44, { showCents: false })} per month</strong> to hit your goal on time.
              </>
            ) : goalStats.paceStatus === "ahead" ? (
              <>
                Great pace! You&apos;re projected to reach $50,000 on{" "}
                <strong>{goalStats.projectedCompletionDate ? formatDate(goalStats.projectedCompletionDate) : "—"}</strong>, ahead of your {formatDate(settings.goalDeadline)} target.
              </>
            ) : (
              <>
                You&apos;re on track. Forecasted revenue by {formatDate(settings.goalDeadline)}:{" "}
                <strong>{formatCents(goalStats.forecastedRevenueAtDeadlineCents, { showCents: false })}</strong>.
              </>
            )}
          </p>
        </CardBody>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Monthly Revenue</CardTitle></CardHeader>
          <CardBody><RevenueChart data={revenueSeries} /></CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Cumulative Progress Toward Goal</CardTitle></CardHeader>
          <CardBody>
            <RevenueChart data={cumulativeSeries.map((c) => ({ label: c.label, revenueCents: c.cumulativeCents }))} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-navy-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
    </div>
  );
}
