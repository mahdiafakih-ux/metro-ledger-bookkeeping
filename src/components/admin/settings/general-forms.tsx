"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, FormField } from "@/components/ui/form";
import { saveBusinessInfo, saveHomepageWording, saveGoalSettings } from "@/lib/actions/settings";

export function BusinessInfoForm({ initial }: {
  initial: { businessName: string; phone: string; email: string; serviceArea: string; addressLine: string; facebookUrl: string; instagramUrl: string; linkedinUrl: string; googleBusinessUrl: string };
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initial);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await saveBusinessInfo(form);
    setSaving(false);
    toast.success("Business info saved");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Business Name"><Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} /></FormField>
        <FormField label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></FormField>
        <FormField label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FormField>
        <FormField label="Service Area"><Input value={form.serviceArea} onChange={(e) => setForm({ ...form, serviceArea: e.target.value })} /></FormField>
      </div>
      <FormField label="Address / Coverage Description"><Textarea value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} /></FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Facebook URL"><Input value={form.facebookUrl} onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })} /></FormField>
        <FormField label="Instagram URL"><Input value={form.instagramUrl} onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })} /></FormField>
        <FormField label="LinkedIn URL"><Input value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} /></FormField>
        <FormField label="Google Business URL"><Input value={form.googleBusinessUrl} onChange={(e) => setForm({ ...form, googleBusinessUrl: e.target.value })} /></FormField>
      </div>
      <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Business Info</Button>
    </form>
  );
}

export function HomepageWordingForm({ initial }: { initial: { heroHeadline: string; heroSubheadline: string } }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initial);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await saveHomepageWording(form);
    setSaving(false);
    toast.success("Homepage wording saved");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Hero Headline"><Input value={form.heroHeadline} onChange={(e) => setForm({ ...form, heroHeadline: e.target.value })} /></FormField>
      <FormField label="Hero Subheadline"><Textarea value={form.heroSubheadline} onChange={(e) => setForm({ ...form, heroSubheadline: e.target.value })} /></FormField>
      <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Homepage Wording</Button>
    </form>
  );
}

export function GoalSettingsForm({ initial }: { initial: { goalAmountDollars: number; goalDeadline: string } }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initial);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await saveGoalSettings(form);
    setSaving(false);
    toast.success("Goal settings saved");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Goal Amount ($)"><Input type="number" min={0} value={form.goalAmountDollars} onChange={(e) => setForm({ ...form, goalAmountDollars: Number(e.target.value) })} /></FormField>
        <FormField label="Target Date"><Input type="date" value={form.goalDeadline} onChange={(e) => setForm({ ...form, goalDeadline: e.target.value })} /></FormField>
      </div>
      <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Goal</Button>
    </form>
  );
}
