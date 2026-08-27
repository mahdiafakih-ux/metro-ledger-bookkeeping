import { Flame, Target } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ScorecardForm } from "@/components/admin/scorecard-form";
import { computeDailyScore, computeStreak } from "@/lib/scorecard";
import { cn } from "@/lib/utils";

function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function ScorecardPage() {
  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  const todayDate = today();
  const thirtyDaysAgo = new Date(todayDate);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [todayEntry, recentEntries] = await Promise.all([
    prisma.scorecardEntry.findUnique({ where: { date: todayDate } }),
    prisma.scorecardEntry.findMany({ where: { date: { gte: thirtyDaysAgo } }, orderBy: { date: "desc" } }),
  ]);

  const targets = {
    targetBusinessesContacted: settings?.targetBusinessesContacted ?? 20,
    targetCalls: settings?.targetCalls ?? 10,
    targetEmails: settings?.targetEmails ?? 10,
    targetFollowUps: settings?.targetFollowUps ?? 5,
  };

  const todayScore = todayEntry ? computeDailyScore(todayEntry, targets) : 0;
  const scores = recentEntries.map((e) => ({ date: e.date, score: computeDailyScore(e, targets) }));
  const currentStreak = computeStreak(scores);

  const streakMilestones = [3, 7, 30];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Daily Business Scorecard</h1>
        <p className="mt-1 text-sm text-navy-400">Stay consistent — small daily actions compound into real growth.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardBody className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-navy-400">Today&apos;s Score</p>
            <p className={cn("mt-3 text-6xl font-extrabold", todayScore >= 80 ? "text-success-600" : todayScore >= 50 ? "text-warning-600" : "text-danger-500")}>
              {todayScore}%
            </p>
            <ProgressBar percent={todayScore} className="mt-6 w-full" />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Streaks</CardTitle></CardHeader>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning-100 text-warning-600">
                <Flame className="h-7 w-7" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-navy-900">{currentStreak} day{currentStreak === 1 ? "" : "s"}</p>
                <p className="text-sm text-navy-400">Current streak at 80%+ daily score</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {streakMilestones.map((m) => (
                <div key={m} className={cn("rounded-xl border-2 p-4 text-center", currentStreak >= m ? "border-accent-500 bg-accent-100/40" : "border-navy-100")}>
                  <Target className={cn("mx-auto h-5 w-5", currentStreak >= m ? "text-accent-600" : "text-navy-300")} />
                  <p className={cn("mt-2 font-bold", currentStreak >= m ? "text-accent-700" : "text-navy-400")}>{m}-Day Streak</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Log Today&apos;s Progress</CardTitle></CardHeader>
        <CardBody>
          <p className="mb-4 text-sm text-navy-400">
            Daily targets: {targets.targetBusinessesContacted} businesses contacted, {targets.targetCalls} calls, {targets.targetEmails} emails, {targets.targetFollowUps} follow-ups, and one social media post. Edit targets in Settings.
          </p>
          <ScorecardForm
            initial={{
              businessesContacted: todayEntry?.businessesContacted ?? 0,
              calls: todayEntry?.calls ?? 0,
              emails: todayEntry?.emails ?? 0,
              followUps: todayEntry?.followUps ?? 0,
              socialPostDone: todayEntry?.socialPostDone ?? false,
              appointmentsCompleted: todayEntry?.appointmentsCompleted ?? 0,
              revenueDollars: (todayEntry?.revenueCents ?? 0) / 100,
              leadsGenerated: todayEntry?.leadsGenerated ?? 0,
            }}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Last 30 Days</CardTitle></CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-1.5">
            {scores.slice(0, 30).reverse().map((s) => (
              <div
                key={s.date.toISOString()}
                title={`${s.date.toLocaleDateString()}: ${s.score}%`}
                className={cn(
                  "h-6 w-6 rounded",
                  s.score >= 80 ? "bg-success-500" : s.score >= 50 ? "bg-warning-500" : s.score > 0 ? "bg-danger-400" : "bg-navy-100"
                )}
              />
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
