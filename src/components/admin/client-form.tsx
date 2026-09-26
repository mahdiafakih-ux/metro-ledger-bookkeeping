"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, FormField } from "@/components/ui/form";
import { createClient, updateClient, type ClientInput } from "@/lib/actions/clients";
import { CLIENT_TYPES, LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/constants";
import { titleCase } from "@/lib/utils";

export function ClientForm({ clientId, initial }: { clientId?: string; initial?: Partial<ClientInput> }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [clientType, setClientType] = useState(initial?.clientType ?? "individual");
  const [currentPackage, setCurrentPackage] = useState(initial?.currentPackage ?? "");
  const [amountOwed, setAmountOwed] = useState(initial?.amountOwedDollars ?? 0);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [followUpDate, setFollowUpDate] = useState(initial?.followUpDate ?? "");
  const [leadStatus, setLeadStatus] = useState(initial?.leadStatus ?? "new_lead");
  const [leadSource, setLeadSource] = useState(initial?.leadSource ?? "website");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const input: ClientInput = {
      name, company, email, phone, clientType, currentPackage,
      amountOwedDollars: amountOwed, notes, followUpDate: followUpDate || undefined,
      leadStatus, leadSource,
    };
    const res = clientId ? await updateClient(clientId, input) : await createClient(input);
    setSaving(false);
    if (!res.success) { toast.error("Could not save client"); return; }
    toast.success(clientId ? "Client updated" : "Client created");
    router.push(clientId ? `/admin/clients/${clientId}` : "/admin/clients");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Full Name"><Input required value={name} onChange={(e) => setName(e.target.value)} /></FormField>
        <FormField label="Company"><Input value={company} onChange={(e) => setCompany(e.target.value)} /></FormField>
        <FormField label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></FormField>
        <FormField label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></FormField>
        <FormField label="Client Type">
          <Select value={clientType} onChange={(e) => setClientType(e.target.value)}>
            {CLIENT_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
          </Select>
        </FormField>
        <FormField label="Lead Status">
          <Select value={leadStatus} onChange={(e) => setLeadStatus(e.target.value)}>
            {LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
          </Select>
        </FormField>
        <FormField label="Lead Source">
          <Select value={leadSource} onChange={(e) => setLeadSource(e.target.value)}>
            {["website", "referral", "google", "outreach", "social", "linkedin", "other"].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </Select>
        </FormField>
        <FormField label="Current Package"><Input value={currentPackage} onChange={(e) => setCurrentPackage(e.target.value)} placeholder="e.g. Individual, Business10, Business30" /></FormField>
        <FormField label="Amount Owed ($)"><Input type="number" min={0} step="0.01" value={amountOwed} onChange={(e) => setAmountOwed(Number(e.target.value))} /></FormField>
        <FormField label="Follow-Up Date"><Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} /></FormField>
      </div>
      <FormField label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></FormField>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {clientId ? "Save Changes" : "Create Client"}
        </Button>
      </div>
    </form>
  );
}
