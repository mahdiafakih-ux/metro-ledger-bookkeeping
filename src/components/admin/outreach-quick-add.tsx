"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { createOutreachEntry } from "@/lib/actions/outreach";
import { BUSINESS_CATEGORIES, BUSINESS_CATEGORY_LABELS, OUTREACH_METHODS, OUTREACH_METHOD_LABELS, OUTREACH_RESPONSES, OUTREACH_RESPONSE_LABELS } from "@/lib/constants";

export function OutreachQuickAdd() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [companyType, setCompanyType] = useState("other");
  const [method, setMethod] = useState("call");
  const [response, setResponse] = useState("no_response");
  const [followUpDate, setFollowUpDate] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessName.trim()) return;
    setSaving(true);
    const res = await createOutreachEntry({
      businessName, contactName, phone, email, companyType,
      dateContacted: new Date().toISOString().slice(0, 10),
      method, response,
      followUpDate: followUpDate || undefined,
      notes: "",
      status: response === "interested" ? "follow_up" : "new",
    });
    setSaving(false);
    if (!res.success) { toast.error("Could not save"); return; }
    toast.success("Outreach logged");
    setBusinessName(""); setContactName(""); setPhone(""); setEmail(""); setFollowUpDate("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-2xl border border-navy-100 bg-white p-4 sm:grid-cols-3 lg:grid-cols-8">
      <Input placeholder="Business name" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="lg:col-span-2" />
      <Input placeholder="Contact name" value={contactName} onChange={(e) => setContactName(e.target.value)} />
      <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Select value={companyType} onChange={(e) => setCompanyType(e.target.value)}>
        {BUSINESS_CATEGORIES.map((c) => <option key={c} value={c}>{BUSINESS_CATEGORY_LABELS[c]}</option>)}
      </Select>
      <Select value={method} onChange={(e) => setMethod(e.target.value)}>
        {OUTREACH_METHODS.map((m) => <option key={m} value={m}>{OUTREACH_METHOD_LABELS[m]}</option>)}
      </Select>
      <Select value={response} onChange={(e) => setResponse(e.target.value)}>
        {OUTREACH_RESPONSES.map((r) => <option key={r} value={r}>{OUTREACH_RESPONSE_LABELS[r]}</option>)}
      </Select>
      <Button type="submit" disabled={saving} className="lg:col-span-8">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Log Outreach
      </Button>
    </form>
  );
}
