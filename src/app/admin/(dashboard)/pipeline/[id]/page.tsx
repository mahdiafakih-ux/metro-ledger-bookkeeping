import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { OpportunityForm } from "@/components/admin/opportunity-form";

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opp = await prisma.pipelineOpportunity.findUnique({ where: { id } });
  if (!opp) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{opp.businessName}</h1>
        <p className="mt-1 text-sm text-navy-400">Edit opportunity details</p>
      </div>
      <div className="rounded-2xl border border-navy-100 bg-white p-6 sm:p-8">
        <OpportunityForm
          opportunityId={opp.id}
          initial={{
            businessName: opp.businessName,
            contactName: opp.contactName,
            category: opp.category,
            stage: opp.stage,
            potentialMonthlyDollars: opp.potentialMonthlyCents / 100,
            probability: opp.probability,
            expectedCloseDate: opp.expectedCloseDate ? opp.expectedCloseDate.toISOString().slice(0, 10) : "",
            notes: opp.notes,
          }}
        />
      </div>
    </div>
  );
}
