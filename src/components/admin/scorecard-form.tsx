"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, FormField } from "@/components/ui/form";
import { saveTodayScorecard } from "@/lib/actions/scorecard";

export function ScorecardForm({ initial }: {
  initial: {
    businessesContacted: number; calls: number; emails: number; followUps: number;
    socialPostDone: boolean; appointmentsCompleted: number; revenueDollars: number; leadsGenerated: number;
  };
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [businessesContacted, setBusinessesContacted] = useState(initial.businessesContacted);
  const [calls, setCalls] = useState(initial.calls);
  const [emails, setEmails] = useState(initial.emails);
  const [followUps, setFollowUps] = useState(initial.followUps);
  const [socialPostDone, setSocialPostDone] = useState(initial.socialPostDone);
  const [appointmentsCompleted, setAppointmentsCompleted] = useState(initial.appointmentsCompleted);
  const [revenueDollars, setRevenueDollars] = useState(initial.revenueDollars);
  const [leadsGenerated, setLeadsGenerated] = useState(initial.leadsGenerated);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await saveTodayScorecard({ businessesContacted, calls, emails, followUps, socialPostDone, appointmentsCompleted, revenueDollars, leadsGenerated });
    setSaving(false);
    toast.success("Today's scorecard saved");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <FormField label="Businesses Contacted"><Input type="number" min={0} value={businessesContacted} onChange={(e) => setBusinessesContacted(Number(e.target.value))} /></FormField>
        <FormField label="Calls"><Input type="number" min={0} value={calls} onChange={(e) => setCalls(Number(e.target.value))} /></FormField>
        <FormField label="Emails"><Input type="number" min={0} value={emails} onChange={(e) => setEmails(Number(e.target.value))} /></FormField>
        <FormField label="Follow-Ups"><Input type="number" min={0} value={followUps} onChange={(e) => setFollowUps(Number(e.target.value))} /></FormField>
        <FormField label="Appointments Completed"><Input type="number" min={0} value={appointmentsCompleted} onChange={(e) => setAppointmentsCompleted(Number(e.target.value))} /></FormField>
        <FormField label="Revenue Earned ($)"><Input type="number" min={0} step="0.01" value={revenueDollars} onChange={(e) => setRevenueDollars(Number(e.target.value))} /></FormField>
        <FormField label="Leads Generated"><Input type="number" min={0} value={leadsGenerated} onChange={(e) => setLeadsGenerated(Number(e.target.value))} /></FormField>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy-500">Social Post</label>
          <label className="flex h-10 items-center gap-2 text-sm text-navy-700">
            <input type="checkbox" checked={socialPostDone} onChange={(e) => setSocialPostDone(e.target.checked)} className="h-4 w-4 rounded border-navy-300" />
            Completed today
          </label>
        </div>
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Today&apos;s Scorecard
      </Button>
    </form>
  );
}
