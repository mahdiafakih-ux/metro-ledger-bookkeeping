"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { submitBusinessInquiry } from "@/lib/actions/business-inquiry";
import { BUSINESS_CATEGORIES, BUSINESS_CATEGORY_LABELS } from "@/lib/constants";

export function BusinessInquiryForm() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await submitBusinessInquiry({
      companyName: form.get("companyName"),
      category: form.get("category"),
      contactName: form.get("contactName"),
      email: form.get("email"),
      phone: form.get("phone"),
      expectedMonthlyVolume: form.get("expectedMonthlyVolume"),
      message: form.get("message"),
    });
    setSubmitting(false);
    if (!res.success) {
      setError(res.error ?? "Something went wrong. Please try again.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-success-100 bg-success-100/40 p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success-600" />
        <h3 className="mt-4 text-lg font-bold text-navy-900">Thanks — we&apos;ll be in touch!</h3>
        <p className="mt-2 text-sm text-navy-500">A member of our team will reach out within one business day to discuss the right plan for you.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Company Name</Label>
          <Input name="companyName" required placeholder="Acme Title Co." />
        </div>
        <div>
          <Label>Company Type</Label>
          <Select name="category" defaultValue="title_company">
            {BUSINESS_CATEGORIES.map((c) => <option key={c} value={c}>{BUSINESS_CATEGORY_LABELS[c]}</option>)}
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Your Name</Label>
          <Input name="contactName" required placeholder="Jane Smith" />
        </div>
        <div>
          <Label>Work Email</Label>
          <Input type="email" name="email" required placeholder="jane@acmetitle.com" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Phone</Label>
          <Input type="tel" name="phone" required placeholder="(313) 555-0100" />
        </div>
        <div>
          <Label>Estimated Appointments / Month</Label>
          <Input type="number" name="expectedMonthlyVolume" min={0} defaultValue={10} />
        </div>
      </div>
      <div>
        <Label>Tell us about your notary needs</Label>
        <Textarea name="message" placeholder="e.g. We close 15-20 files a month and need reliable same-day signings..." />
      </div>
      {error && <p className="text-sm font-medium text-danger-600">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Request a Consultation
      </Button>
    </form>
  );
}
