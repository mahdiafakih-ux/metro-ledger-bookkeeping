import { prisma } from "@/lib/db";
import { PipelineBoard } from "@/components/admin/pipeline-board";
import { formatCents } from "@/lib/money";

export default async function PipelinePage() {
  const opportunities = await prisma.pipelineOpportunity.findMany({ orderBy: { createdAt: "desc" } });

  const openOpps = opportunities.filter((o) => o.stage !== "won" && o.stage !== "lost");
  const potentialMonthly = openOpps.reduce((sum, o) => sum + o.potentialMonthlyCents, 0);
  const weightedMonthly = openOpps.reduce((sum, o) => sum + (o.potentialMonthlyCents * o.probability) / 100, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Sales Pipeline</h1>
        <p className="mt-1 text-sm text-navy-400">Drag opportunities between stages as deals progress.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Open Opportunities" value={String(openOpps.length)} />
        <Stat label="Potential Monthly" value={formatCents(potentialMonthly, { showCents: false })} />
        <Stat label="Potential Annual" value={formatCents(potentialMonthly * 12, { showCents: false })} />
        <Stat label="Weighted Monthly (by probability)" value={formatCents(Math.round(weightedMonthly), { showCents: false })} />
      </div>

      <PipelineBoard opportunities={opportunities} />
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
