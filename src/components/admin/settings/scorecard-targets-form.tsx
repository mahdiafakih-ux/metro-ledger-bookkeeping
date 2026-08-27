"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, FormField } from "@/components/ui/form";
import { saveScorecardTargets } from "@/lib/actions/scorecard";

export function ScorecardTargetsForm({ initial }: { initial: { targetBusinessesContacted: number; targetCalls: number; targetEmails: number; targetFollowUps: number } }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initial);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await saveScorecardTargets(form);
    setSaving(false);
    toast.success("Daily targets saved");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <FormField label="Businesses Contacted"><Input type="number" min={0} value={form.targetBusinessesContacted} onChange={(e) => setForm({ ...form, targetBusinessesContacted: Number(e.target.value) })} /></FormField>
        <FormField label="Calls"><Input type="number" min={0} value={form.targetCalls} onChange={(e) => setForm({ ...form, targetCalls: Number(e.target.value) })} /></FormField>
        <FormField label="Emails"><Input type="number" min={0} value={form.targetEmails} onChange={(e) => setForm({ ...form, targetEmails: Number(e.target.value) })} /></FormField>
        <FormField label="Follow-Ups"><Input type="number" min={0} value={form.targetFollowUps} onChange={(e) => setForm({ ...form, targetFollowUps: Number(e.target.value) })} /></FormField>
      </div>
      <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Daily Targets</Button>
    </form>
  );
}
