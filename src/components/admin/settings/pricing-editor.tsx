"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, FormField } from "@/components/ui/form";
import { updatePricingPlan, type PricingPlanUpdateInput } from "@/lib/actions/pricing";

export interface PlanRow {
  id: string;
  key: string;
  name: string;
  statutoryFeeDollars: number;
  serviceFeeDollars: number;
  serviceFeeLabel: string;
  appointmentsIncluded: number | null;
  overageFeeDollars: number | null;
  description: string;
  highlight: boolean;
  isActive: boolean;
}

export function PricingPlanEditor({ plan }: { plan: PlanRow }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PricingPlanUpdateInput>({
    name: plan.name,
    statutoryFeeDollars: plan.statutoryFeeDollars,
    serviceFeeDollars: plan.serviceFeeDollars,
    serviceFeeLabel: plan.serviceFeeLabel,
    appointmentsIncluded: plan.appointmentsIncluded,
    overageFeeDollars: plan.overageFeeDollars,
    description: plan.description,
    highlight: plan.highlight,
    isActive: plan.isActive,
  });

  const total = form.statutoryFeeDollars + form.serviceFeeDollars;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await updatePricingPlan(plan.id, form);
    setSaving(false);
    toast.success(`${form.name} updated`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-navy-100 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-navy-900">{plan.key}</h3>
          {!plan.isActive && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              Discontinued — not shown to customers
            </span>
          )}
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-navy-500">
          <input type="checkbox" checked={form.highlight} onChange={(e) => setForm({ ...form, highlight: e.target.checked })} className="h-3.5 w-3.5 rounded border-navy-300" />
          Most Popular
        </label>
      </div>
      <FormField label="Display Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Statutory Fee ($/act)" hint="Michigan max $10"><Input type="number" min={0} max={10} step="0.01" value={form.statutoryFeeDollars} onChange={(e) => setForm({ ...form, statutoryFeeDollars: Number(e.target.value) })} /></FormField>
        <FormField label="Service Fee ($)"><Input type="number" min={0} step="0.01" value={form.serviceFeeDollars} onChange={(e) => setForm({ ...form, serviceFeeDollars: Number(e.target.value) })} /></FormField>
      </div>
      <FormField label="Service Fee Label"><Input value={form.serviceFeeLabel} onChange={(e) => setForm({ ...form, serviceFeeLabel: e.target.value })} /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Appointments Included" hint="Blank = unlimited">
          <Input
            type="number"
            min={0}
            value={form.appointmentsIncluded ?? ""}
            onChange={(e) => setForm({ ...form, appointmentsIncluded: e.target.value === "" ? null : Number(e.target.value) })}
          />
        </FormField>
        <FormField label="Overage Fee ($)" hint="Blank = none">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={form.overageFeeDollars ?? ""}
            onChange={(e) => setForm({ ...form, overageFeeDollars: e.target.value === "" ? null : Number(e.target.value) })}
          />
        </FormField>
      </div>
      <FormField label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>
      <div className="rounded-lg bg-navy-50 p-3 text-sm">
        <span className="text-navy-500">Total displayed price: </span>
        <span className="font-bold text-navy-900">${total.toFixed(2)}</span>
      </div>
      <Button type="submit" size="sm" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Plan</Button>
    </form>
  );
}
