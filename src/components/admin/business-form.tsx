"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, FormField } from "@/components/ui/form";
import { createBusiness, updateBusiness, type BusinessInput } from "@/lib/actions/businesses";
import { BUSINESS_CATEGORIES, BUSINESS_CATEGORY_LABELS } from "@/lib/constants";
import { titleCase } from "@/lib/utils";
import { planDisplayName } from "@/lib/plans";

export function BusinessForm({ businessId, initial, pricingPlans }: { businessId?: string; initial?: Partial<BusinessInput>; pricingPlans: { key: string; name: string }[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState(initial?.companyName ?? "");
  const [category, setCategory] = useState(initial?.category ?? "title_company");
  const [contactName, setContactName] = useState(initial?.contactName ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [billingContactName, setBillingContactName] = useState(initial?.billingContactName ?? "");
  const [billingContactEmail, setBillingContactEmail] = useState(initial?.billingContactEmail ?? "");
  const [billingContactPhone, setBillingContactPhone] = useState(initial?.billingContactPhone ?? "");
  const [packageKey, setPackageKey] = useState(initial?.packageKey ?? "");
  const [monthlyUsage, setMonthlyUsage] = useState(initial?.monthlyUsage ?? 0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(initial?.monthlyRevenueDollars ?? 0);
  const [expectedMonthlyVolume, setExpectedMonthlyVolume] = useState(initial?.expectedMonthlyVolume ?? 0);
  const [customPricingNotes, setCustomPricingNotes] = useState(initial?.customPricingNotes ?? "");
  const [status, setStatus] = useState(initial?.status ?? "lead");
  const [contractStart, setContractStart] = useState(initial?.contractStart ?? "");
  const [contractEndDate, setContractEndDate] = useState(initial?.contractEndDate ?? "");
  const [renewalDate, setRenewalDate] = useState(initial?.renewalDate ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [followUpDate, setFollowUpDate] = useState(initial?.followUpDate ?? "");
  const [leadSource, setLeadSource] = useState(initial?.leadSource ?? "outreach");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const input: BusinessInput = {
      companyName, category, contactName, email, phone,
      billingContactName, billingContactEmail, billingContactPhone,
      packageKey, monthlyUsage, monthlyRevenueDollars: monthlyRevenue,
      expectedMonthlyVolume, customPricingNotes, status,
      contractStart: contractStart || undefined, contractEndDate: contractEndDate || undefined, renewalDate: renewalDate || undefined,
      notes, followUpDate: followUpDate || undefined, leadSource,
    };
    const res = businessId ? await updateBusiness(businessId, input) : await createBusiness(input);
    setSaving(false);
    if (!res.success) { toast.error("Could not save business"); return; }
    toast.success(businessId ? "Business updated" : "Business created");
    router.push(businessId ? `/admin/businesses/${businessId}` : "/admin/businesses");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-navy-400">Company Profile</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Company Name"><Input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></FormField>
          <FormField label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {BUSINESS_CATEGORIES.map((c) => <option key={c} value={c}>{BUSINESS_CATEGORY_LABELS[c]}</option>)}
            </Select>
          </FormField>
          <FormField label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {["lead", "active", "inactive"].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
            </Select>
          </FormField>
          <FormField label="Lead Source">
            <Select value={leadSource} onChange={(e) => setLeadSource(e.target.value)}>
              {["outreach", "referral", "website", "cold_call", "linkedin", "other"].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
            </Select>
          </FormField>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-navy-400">Primary Contact</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Contact Name"><Input value={contactName} onChange={(e) => setContactName(e.target.value)} /></FormField>
          <FormField label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></FormField>
          <FormField label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></FormField>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-navy-400">Billing Contact</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Billing Contact Name" hint="Leave blank if same as primary"><Input value={billingContactName} onChange={(e) => setBillingContactName(e.target.value)} /></FormField>
          <FormField label="Billing Email"><Input type="email" value={billingContactEmail} onChange={(e) => setBillingContactEmail(e.target.value)} /></FormField>
          <FormField label="Billing Phone"><Input value={billingContactPhone} onChange={(e) => setBillingContactPhone(e.target.value)} /></FormField>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-navy-400">Plan & Volume</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Assigned Plan">
            <Select value={packageKey} onChange={(e) => setPackageKey(e.target.value)}>
              <option value="">— None —</option>
              {pricingPlans.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
              {packageKey && !pricingPlans.some((p) => p.key === packageKey) && (
                <option value={packageKey}>{planDisplayName(packageKey)} (legacy)</option>
              )}
            </Select>
          </FormField>
          <FormField label="Monthly Revenue ($)"><Input type="number" min={0} step="0.01" value={monthlyRevenue} onChange={(e) => setMonthlyRevenue(Number(e.target.value))} /></FormField>
          <FormField label="Monthly Usage (appointments)" hint="Actual appointments this month"><Input type="number" min={0} value={monthlyUsage} onChange={(e) => setMonthlyUsage(Number(e.target.value))} /></FormField>
          <FormField label="Expected Monthly Volume" hint="Estimated appointments/month at signup"><Input type="number" min={0} value={expectedMonthlyVolume} onChange={(e) => setExpectedMonthlyVolume(Number(e.target.value))} /></FormField>
        </div>
        <FormField label="Custom Pricing Agreement" hint="Any negotiated terms outside the standard plan"><Textarea value={customPricingNotes} onChange={(e) => setCustomPricingNotes(e.target.value)} /></FormField>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-navy-400">Contract & Follow-Up</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Contract Start"><Input type="date" value={contractStart} onChange={(e) => setContractStart(e.target.value)} /></FormField>
          <FormField label="Contract End"><Input type="date" value={contractEndDate} onChange={(e) => setContractEndDate(e.target.value)} /></FormField>
          <FormField label="Renewal Date"><Input type="date" value={renewalDate} onChange={(e) => setRenewalDate(e.target.value)} /></FormField>
          <FormField label="Follow-Up Date"><Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} /></FormField>
        </div>
      </section>

      <FormField label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></FormField>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {businessId ? "Save Changes" : "Create Business"}
        </Button>
      </div>
    </form>
  );
}
