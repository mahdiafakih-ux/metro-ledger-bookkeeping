import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AddRevenueForm } from "@/components/admin/add-revenue-form";
import { RevenueCalculator } from "@/components/admin/revenue-calculator";
import { getBusinessSettings } from "@/lib/settings";
import { computeGoalStats } from "@/lib/goal";
import { getTotalEarnedCents } from "@/lib/queries/dashboard";
import { formatCents } from "@/lib/money";
import { formatDate, titleCase } from "@/lib/utils";

const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual Entry",
  appointment: "Appointment",
  subscription: "Subscription",
  invoice: "Invoice",
};

export default async function RevenuePage() {
  const [entries, settings, totalEarnedCents] = await Promise.all([
    prisma.revenueEntry.findMany({ orderBy: { date: "desc" }, take: 100 }),
    getBusinessSettings(),
    getTotalEarnedCents(),
  ]);

  const goalStats = computeGoalStats({
    goalAmountCents: settings.goalAmountCents,
    goalDeadline: settings.goalDeadline,
    goalStartDate: settings.goalStartDate,
    earnedCents: totalEarnedCents,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Revenue</h1>
          <p className="mt-1 text-sm text-navy-400">Total earned: {formatCents(totalEarnedCents, { showCents: false })}</p>
        </div>
        <AddRevenueForm />
      </div>

      <RevenueCalculator remainingGoalCents={goalStats.remainingCents} />

      <Card>
        <CardHeader><CardTitle>Revenue Log</CardTitle></CardHeader>
        <CardBody className="p-0">
          {entries.length === 0 ? (
            <div className="p-6"><EmptyState title="No revenue recorded yet" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-navy-50 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3">Source</th>
                    <th className="px-5 py-3">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100">
                  {entries.map((e) => (
                    <tr key={e.id} className="hover:bg-navy-50">
                      <td className="px-5 py-3.5 text-navy-500">{formatDate(e.date)}</td>
                      <td className="px-5 py-3.5 font-medium text-navy-900">{e.description || titleCase(e.source)}</td>
                      <td className="px-5 py-3.5"><Badge tone={e.source === "manual" ? "neutral" : "blue"}>{SOURCE_LABELS[e.source] ?? e.source}</Badge></td>
                      <td className="px-5 py-3.5 font-semibold text-navy-900">{formatCents(e.amountCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
