import { prisma } from "@/lib/db";
import { PipelineBoard } from "@/components/admin/pipeline-board";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents } from "@/lib/money";
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS } from "@/lib/constants";

export default async function PipelinePage() {
  const opportunities = await prisma.pipelineOpportunity.findMany({ orderBy: { createdAt: "desc" } });

  const openOpps = opportunities.filter((o) => o.stage !== "won" && o.stage !== "lost");
  const wonOpps = opportunities.filter((o) => o.stage === "won");
  const lostOpps = opportunities.filter((o) => o.stage === "lost");
  const closedCount = wonOpps.length + lostOpps.length;
  const conversionRate = closedCount > 0 ? (wonOpps.length / closedCount) * 100 : 0;

  const potentialMonthly = openOpps.reduce((sum, o) => sum + o.potentialMonthlyCents, 0);
  const weightedMonthly = openOpps.reduce((sum, o) => sum + (o.potentialMonthlyCents * o.probability) / 100, 0);
  const avgDealValue = opportunities.length > 0 ? opportunities.reduce((s, o) => s + o.dealValueCents, 0) / opportunities.length : 0;

  const funnel = PIPELINE_STAGES.map((stage) => ({
    stage,
    label: PIPELINE_STAGE_LABELS[stage],
    count: opportunities.filter((o) => o.stage === stage).length,
  }));
  const maxFunnelCount = Math.max(...funnel.map((f) => f.count), 1);

  const lostReasons = new Map<string, number>();
  for (const o of lostOpps) {
    const reason = o.lostReason || "No reason recorded";
    lostReasons.set(reason, (lostReasons.get(reason) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Sales Pipeline</h1>
        <p className="mt-1 text-sm text-navy-400">Drag opportunities between stages as deals progress.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Open Opportunities" value={String(openOpps.length)} />
        <Stat label="Potential Monthly" value={formatCents(potentialMonthly, { showCents: false })} />
        <Stat label="Weighted Monthly (by probability)" value={formatCents(Math.round(weightedMonthly), { showCents: false })} />
        <Stat label="Conversion Rate" value={`${conversionRate.toFixed(1)}%`} />
      </div>

      <PipelineBoard
        opportunities={opportunities.map((o) => ({
          id: o.id,
          businessName: o.businessName,
          contactName: o.contactName,
          category: o.category,
          stage: o.stage,
          potentialMonthlyCents: o.potentialMonthlyCents,
          probability: o.probability,
          expectedCloseDate: o.expectedCloseDate,
          nextAction: o.nextAction,
          contactAttempts: o.contactAttempts,
        }))}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Pipeline Funnel</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            {funnel.map((f) => (
              <div key={f.stage}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-navy-700">{f.label}</span>
                  <span className="font-semibold text-navy-900">{f.count}</span>
                </div>
                <div className="h-2 rounded-full bg-navy-100">
                  <div
                    className={`h-full rounded-full ${f.stage === "won" ? "bg-success-500" : f.stage === "lost" ? "bg-danger-400" : "bg-accent-500"}`}
                    style={{ width: `${(f.count / maxFunnelCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Deal Insights</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <div className="flex justify-between border-b border-navy-50 pb-3 text-sm">
              <span className="text-navy-500">Average Deal Value</span>
              <span className="font-bold text-navy-900">{formatCents(Math.round(avgDealValue), { showCents: false })}</span>
            </div>
            <div className="flex justify-between border-b border-navy-50 pb-3 text-sm">
              <span className="text-navy-500">Deals Won</span>
              <span className="font-bold text-success-600">{wonOpps.length}</span>
            </div>
            <div className="flex justify-between border-b border-navy-50 pb-3 text-sm">
              <span className="text-navy-500">Deals Lost</span>
              <span className="font-bold text-danger-600">{lostOpps.length}</span>
            </div>
            {lostReasons.size > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">Top Lost Reasons</p>
                <ul className="space-y-1.5 text-sm">
                  {Array.from(lostReasons.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([reason, count]) => (
                      <li key={reason} className="flex justify-between text-navy-600">
                        <span className="truncate pr-2">{reason}</span>
                        <span className="shrink-0 font-semibold text-navy-900">{count}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-navy-100 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-navy-900">{value}</p>
    </div>
  );
}
