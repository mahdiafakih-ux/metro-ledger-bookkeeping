"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, FormField } from "@/components/ui/form";
import { updatePricingPlan, type PricingPlanUpdateInput } from "@/lib/actions/pricing";
import { getSubscriptionPlan, isSubscriptionPlanKey } from "@/lib/plans";

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
  features: string[];
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
    features: plan.features,
    highlight: plan.highlight,
    isActive: plan.isActive,
  });
  const locked = isSubscriptionPlanKey(plan.key);

  const total = form.statutoryFeeDollars + form.serviceFeeDollars;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await updatePricingPlan(plan.id, form);
    setSaving(false);
    if (!res.success) {
      toast.error(res.error ?? "Could not save");
      return;
    }
    toast.success(`${form.name} updated`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-navy-100 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-navy-900">{plan.name} <span className="text-xs font-normal text-navy-400">({plan.key})</span></h3>
        <label className="flex items-center gap-2 text-xs font-medium text-navy-500">
          <input type="checkbox" checked={form.highlight} onChange={(e) => setForm({ ...form, highlight: e.target.checked })} className="h-3.5 w-3.5 rounded border-navy-300" />
          Featured card
        </label>
      </div>
      <FormField label="Display Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
      {locked ? (
        <div className="grid grid-cols-3 gap-3 rounded-lg bg-navy-50 p-3 text-center text-xs">
          <div><p className="text-navy-400">Monthly</p><p className="font-bold text-navy-900">${((getSubscriptionPlan(plan.key)?.monthlyCents ?? 0) / 100).toLocaleString()}</p></div>
          <div><p className="text-navy-400">Included</p><p className="font-bold text-navy-900">{getSubscriptionPlan(plan.key)?.includedNotarizations}</p></div>
          <div><p className="text-navy-400">Each extra</p><p className="font-bold text-navy-900">${(getSubscriptionPlan(plan.key)?.overagePerNotarizationCents ?? 0) / 100}</p></div>
          <p className="col-span-3 text-[11px] text-navy-400">Set by the plan catalog + Stripe price (read-only here).</p>
        </div>
      ) : (
        <>
      <div className="grid grid-cols-2 gap-3">
          <FormField label="Statutory Fee ($/act)" hint="Michigan max $10"><Input type="number" min={0} max={10} step="0.01" value={form.statutoryFeeDollars} onChange={(e) => setForm({ ...form, statutoryFeeDollars: Number(e.target.value) })} /></FormField>
          <FormField label="Service Fee ($)"><Input type="number" min={0} step="0.01" value={form.serviceFeeDollars} onChange={(e) => setForm({ ...form, serviceFeeDollars: Number(e.target.value) })} /></FormField>
        </div>
        <FormField label="Service Fee Label"><Input value={form.serviceFeeLabel} onChange={(e) => setForm({ ...form, serviceFeeLabel: e.target.value })} /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Notarizations Included" hint="Blank = none">
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
        </>
      )}
      <FormField label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>
      <FormField label="Feature bullets" hint="One per line">
        <Textarea rows={4} value={(form.features ?? []).join("\n")} onChange={(e) => setForm({ ...form, features: e.target.value.split("\n") })} />
      </FormField>
      <label className="flex items-center gap-2 text-xs font-medium text-navy-500">
        <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-3.5 w-3.5 rounded border-navy-300" />
        Show on website
      </label>
      {!locked && (
        <div className="rounded-lg bg-navy-50 p-3 text-sm">
          <span className="text-navy-500">Total displayed price: </span>
          <span className="font-bold text-navy-900">${total.toFixed(2)}</span>
        </div>
      )}
      <Button type="submit" size="sm" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Plan</Button>
    </form>
  );
}
