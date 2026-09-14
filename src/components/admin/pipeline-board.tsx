"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DndContext, useDraggable, useDroppable, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Plus, Calendar, PhoneCall, ArrowRight } from "lucide-react";
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS, BUSINESS_CATEGORY_LABELS } from "@/lib/constants";
import { updateOpportunityStage } from "@/lib/actions/pipeline";
import { formatCents } from "@/lib/money";
import { formatDate, cn } from "@/lib/utils";
import { LinkButton } from "@/components/ui/button";

export interface OpportunityView {
  id: string;
  businessName: string;
  contactName: string;
  category: string;
  stage: string;
  potentialMonthlyCents: number;
  probability: number;
  expectedCloseDate: Date | null;
  nextAction: string;
  contactAttempts: number;
}

function OpportunityCard({ opp }: { opp: OpportunityView }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: opp.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab touch-none rounded-xl border border-navy-100 bg-white p-4 shadow-sm active:cursor-grabbing",
        isDragging && "z-10 opacity-70 shadow-lg"
      )}
    >
      <Link href={`/admin/pipeline/${opp.id}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-navy-900 hover:text-accent-600">
        {opp.businessName}
      </Link>
      <p className="mt-0.5 text-xs text-navy-400">{BUSINESS_CATEGORY_LABELS[opp.category] ?? opp.category}</p>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="font-semibold text-navy-700">{formatCents(opp.potentialMonthlyCents, { showCents: false })}/mo</span>
        <span className="rounded-full bg-accent-100 px-2 py-0.5 font-semibold text-accent-700">{opp.probability}%</span>
      </div>
      {opp.nextAction && (
        <p className="mt-2 flex items-start gap-1 text-[11px] text-navy-500">
          <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-accent-500" /> {opp.nextAction}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between text-[11px] text-navy-400">
        {opp.expectedCloseDate ? (
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(opp.expectedCloseDate)}</span>
        ) : <span />}
        {opp.contactAttempts > 0 && (
          <span className="flex items-center gap-1"><PhoneCall className="h-3 w-3" /> {opp.contactAttempts}</span>
        )}
      </div>
    </div>
  );
}

function Column({ stage, opportunities }: { stage: string; opportunities: OpportunityView[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const totalMonthly = opportunities.reduce((sum, o) => sum + o.potentialMonthlyCents, 0);

  return (
    <div ref={setNodeRef} className={cn("flex w-72 shrink-0 flex-col rounded-2xl border p-3", isOver ? "border-accent-400 bg-accent-100/30" : "border-navy-100 bg-navy-50/50")}>
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-sm font-bold text-navy-900">{PIPELINE_STAGE_LABELS[stage]}</p>
        <span className="rounded-full bg-navy-200 px-2 py-0.5 text-xs font-semibold text-navy-600">{opportunities.length}</span>
      </div>
      <p className="mb-3 px-1 text-xs text-navy-400">{formatCents(totalMonthly, { showCents: false })}/mo potential</p>
      <div className="flex-1 space-y-3">
        {opportunities.map((o) => <OpportunityCard key={o.id} opp={o} />)}
      </div>
    </div>
  );
}

export function PipelineBoard({ opportunities }: { opportunities: OpportunityView[] }) {
  const router = useRouter();
  const [items, setItems] = useState(opportunities);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const newStage = String(over.id);
    const oppId = String(active.id);
    const current = items.find((i: any) => i.id === oppId);
    if (!current || current.stage === newStage) return;

    let lostReason: string | undefined;
    if (newStage === "lost") {
      lostReason = window.prompt(`Why was ${current.businessName} lost? (optional)`) ?? "";
    }

    setItems((prev: any) => prev.map((i: any) => (i.id === oppId ? { ...i, stage: newStage } : i)));
    const res = await updateOpportunityStage(oppId, newStage, lostReason);
    if (res.success) router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <LinkButton href="/admin/pipeline/new"><Plus className="h-4 w-4" /> New Opportunity</LinkButton>
      </div>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="themed-scroll flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage: any) => (
            <Column key={stage} stage={stage} opportunities={items.filter((i: any) => i.stage === stage)} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
