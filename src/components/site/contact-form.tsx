"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, Select } from "@/components/ui/form";
import { submitLead } from "@/lib/actions/leads";

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [isBusinessLead, setIsBusinessLead] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await submitLead({
      name: form.get("name"),
      company: form.get("company"),
      email: form.get("email"),
      phone: form.get("phone"),
      serviceNeeded: form.get("serviceNeeded"),
      message: form.get("message"),
      estimatedAppointmentsPerMonth: form.get("estimatedAppointmentsPerMonth"),
      isBusinessLead,
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
        <h3 className="mt-4 text-lg font-bold text-navy-900">Message sent!</h3>
        <p className="mt-2 text-sm text-navy-500">We&apos;ll get back to you within one business day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="flex items-center gap-2.5 rounded-xl bg-navy-50 p-4 text-sm font-medium text-navy-700">
        <input type="checkbox" checked={isBusinessLead} onChange={(e) => setIsBusinessLead(e.target.checked)} className="h-4 w-4 rounded border-navy-300" />
        I&apos;m reaching out on behalf of a business — become a Business Partner
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Name</Label>
          <Input name="name" required placeholder="Your name" />
        </div>
        <div>
          <Label>Company (optional)</Label>
          <Input name="company" placeholder="Company name" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Email</Label>
          <Input type="email" name="email" required placeholder="you@example.com" />
        </div>
        <div>
          <Label>Phone</Label>
          <Input type="tel" name="phone" placeholder="(313) 555-0100" />
        </div>
      </div>
      <div>
        <Label>Service Needed</Label>
        <Select name="serviceNeeded" defaultValue="">
          <option value="" disabled>Select a service</option>
          <option>Individual Notarization</option>
          <option>Business Recurring Service</option>
          <option>Real Estate / Title</option>
          <option>Law Firm Services</option>
          <option>Other</option>
        </Select>
      </div>
      {isBusinessLead && (
        <div>
          <Label>Estimated Appointments Per Month</Label>
          <Select name="estimatedAppointmentsPerMonth" defaultValue="">
            <option value="" disabled>Select a range</option>
            <option>1-5</option>
            <option>6-15</option>
            <option>16-20</option>
            <option>20+</option>
            <option>Unsure</option>
          </Select>
        </div>
      )}
      <div>
        <Label>Message</Label>
        <Textarea name="message" required placeholder="Tell us what you need..." />
      </div>
      {error && <p className="text-sm font-medium text-danger-600">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Send Message
      </Button>
    </form>
  );
}
