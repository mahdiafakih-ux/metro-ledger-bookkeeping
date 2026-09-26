"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, FormField } from "@/components/ui/form";
import { createOpportunity, updateOpportunity, deleteOpportunity, type OpportunityInput } from "@/lib/actions/pipeline";
import { BUSINESS_CATEGORIES, BUSINESS_CATEGORY_LABELS, PIPELINE_STAGES, PIPELINE_STAGE_LABELS } from "@/lib/constants";

export function OpportunityForm({ opportunityId, initial }: { opportunityId?: string; initial?: Partial<OpportunityInput> }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [businessName, setBusinessName] = useState(initial?.businessName ?? "");
  const [contactName, setContactName] = useState(initial?.contactName ?? "");
  const [category, setCategory] = useState(initial?.category ?? "other");
  const [stage, setStage] = useState(initial?.stage ?? "new_lead");
  const [potentialMonthly, setPotentialMonthly] = useState(initial?.potentialMonthlyDollars ?? 1000);
  const [dealValue, setDealValue] = useState(initial?.dealValueDollars ?? 30000);
  const [probability, setProbability] = useState(initial?.probability ?? 20);
  const [nextAction, setNextAction] = useState(initial?.nextAction ?? "");
  const [nextFollowUpDate, setNextFollowUpDate] = useState(initial?.nextFollowUpDate ?? "");
  const [contactAttempts, setContactAttempts] = useState(initial?.contactAttempts ?? 0);
  const [lostReason, setLostReason] = useState(initial?.lostReason ?? "");
  const [expectedCloseDate, setExpectedCloseDate] = useState(initial?.expectedCloseDate ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const input: OpportunityInput = {
      businessName, contactName, category, stage,
      potentialMonthlyDollars: potentialMonthly, dealValueDollars: dealValue, probability,
      nextAction, nextFollowUpDate: nextFollowUpDate || undefined,
      contactAttempts, lostReason,
      expectedCloseDate: expectedCloseDate || undefined, notes,
    };
    const res = opportunityId ? await updateOpportunity(opportunityId, input) : await createOpportunity(input);
    setSaving(false);
    if (!res.success) { toast.error("Could not save opportunity"); return; }
    toast.success(opportunityId ? "Opportunity updated" : "Opportunity created");
    router.push("/admin/pipeline");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Business Name"><Input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} /></FormField>
        <FormField label="Contact Name"><Input value={contactName} onChange={(e) => setContactName(e.target.value)} /></FormField>
        <FormField label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {BUSINESS_CATEGORIES.map((c) => <option key={c} value={c}>{BUSINESS_CATEGORY_LABELS[c]}</option>)}
          </Select>
        </FormField>
        <FormField label="Stage">
          <Select value={stage} onChange={(e) => setStage(e.target.value)}>
            {PIPELINE_STAGES.map((s) => <option key={s} value={s}>{PIPELINE_STAGE_LABELS[s]}</option>)}
          </Select>
        </FormField>
        <FormField label="Potential Monthly Revenue ($)"><Input type="number" min={0} value={potentialMonthly} onChange={(e) => setPotentialMonthly(Number(e.target.value))} /></FormField>
        <FormField label="Deal Value ($)" hint="Annualized / contract value"><Input type="number" min={0} value={dealValue} onChange={(e) => setDealValue(Number(e.target.value))} /></FormField>
        <FormField label="Probability (%)"><Input type="number" min={0} max={100} value={probability} onChange={(e) => setProbability(Number(e.target.value))} /></FormField>
        <FormField label="Expected Close Date"><Input type="date" value={expectedCloseDate} onChange={(e) => setExpectedCloseDate(e.target.value)} /></FormField>
        <FormField label="Contact Attempts"><Input type="number" min={0} value={contactAttempts} onChange={(e) => setContactAttempts(Number(e.target.value))} /></FormField>
        <FormField label="Next Follow-Up Date"><Input type="date" value={nextFollowUpDate} onChange={(e) => setNextFollowUpDate(e.target.value)} /></FormField>
      </div>
      <FormField label="Next Action"><Input value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="e.g. Send proposal, schedule demo" /></FormField>
      {stage === "lost" && (
        <FormField label="Lost Reason"><Input value={lostReason} onChange={(e) => setLostReason(e.target.value)} placeholder="e.g. Went with a competitor" /></FormField>
      )}
      <FormField label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></FormField>
      <div className="flex items-center justify-between gap-3">
        {opportunityId && (
          <Button
            type="button"
            variant="danger"
            onClick={async () => {
              if (!confirm("Delete this opportunity?")) return;
              await deleteOpportunity(opportunityId);
              toast.success("Opportunity deleted");
              router.push("/admin/pipeline");
              router.refresh();
            }}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        )}
        <div className="ml-auto flex gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {opportunityId ? "Save Changes" : "Create Opportunity"}
          </Button>
        </div>
      </div>
    </form>
  );
}
