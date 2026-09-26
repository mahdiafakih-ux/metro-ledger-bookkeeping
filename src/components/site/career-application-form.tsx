"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, Select } from "@/components/ui/form";
import { submitCareerApplication } from "@/lib/actions/careers";

export function CareerApplicationForm() {
  const [state, formAction, pending] = useActionState(submitCareerApplication, null);

  if (state?.success) {
    return (
      <div className="rounded-2xl border border-success-100 bg-success-100/40 p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success-600" />
        <h3 className="mt-4 text-xl font-bold text-navy-900">Application Received!</h3>
        <p className="mt-2 text-sm text-navy-500">
          Thank you for your interest. We&apos;ll be in touch when a matching opportunity opens.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-lg border border-danger-100 bg-danger-100/40 p-4 text-sm text-danger-600">
          {state.error}
        </div>
      )}

      {/* Name */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>First Name <span className="text-danger-600">*</span></Label>
          <Input name="firstName" required placeholder="Jane" />
        </div>
        <div>
          <Label>Last Name <span className="text-danger-600">*</span></Label>
          <Input name="lastName" required placeholder="Smith" />
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Email <span className="text-danger-600">*</span></Label>
          <Input type="email" name="email" required placeholder="you@example.com" />
        </div>
        <div>
          <Label>Phone <span className="text-danger-600">*</span></Label>
          <Input type="tel" name="phone" required placeholder="(313) 555-0100" />
        </div>
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>City <span className="text-danger-600">*</span></Label>
          <Input name="city" required placeholder="Detroit" />
        </div>
        <div>
          <Label>State <span className="text-danger-600">*</span></Label>
          <Input name="state" required placeholder="e.g. Michigan" />
        </div>
      </div>

      {/* Role interest */}
      <div>
        <Label>Area of Interest <span className="text-danger-600">*</span></Label>
        <Select name="roleInterest" required defaultValue="">
          <option value="" disabled>Select a role...</option>
          <option>Commissioned Notary</option>
          <option>Mobile Notary</option>
          <option>Notary Signing Agent</option>
          <option>Remote Online Notary</option>
          <option>Business Development</option>
          <option>Operations</option>
          <option>Other</option>
        </Select>
      </div>

      {/* Commissioned notary radio */}
      <div>
        <Label>Are you currently a commissioned notary?</Label>
        <div className="mt-2 flex gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-navy-700">
            <input type="radio" name="isCommissionedNotary" value="true" className="accent-accent-500" />
            Yes
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-navy-700">
            <input type="radio" name="isCommissionedNotary" value="false" defaultChecked className="accent-accent-500" />
            No
          </label>
        </div>
      </div>

      {/* Commission details */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Commission State (if applicable)</Label>
          <Input name="commissionState" placeholder="e.g. Michigan" />
        </div>
        <div>
          <Label>Commission Expiry (if applicable)</Label>
          <Input name="commissionExpiry" placeholder="MM/YYYY" />
        </div>
      </div>

      {/* Experience */}
      <div>
        <Label>Experience (check all that apply)</Label>
        <div className="mt-2 space-y-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-navy-700">
            <input type="checkbox" name="mobileExperience" value="true" className="h-4 w-4 accent-accent-500" />
            Mobile Notary Experience
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-navy-700">
            <input type="checkbox" name="ronExperience" value="true" className="h-4 w-4 accent-accent-500" />
            Remote Online Notarization (RON) Experience
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-navy-700">
            <input type="checkbox" name="signingAgentExperience" value="true" className="h-4 w-4 accent-accent-500" />
            Loan Signing Agent Experience
          </label>
        </div>
      </div>

      {/* Availability */}
      <div>
        <Label>Availability</Label>
        <Input name="availability" placeholder="e.g. Weekdays, evenings, weekends..." />
      </div>

      {/* LinkedIn */}
      <div>
        <Label>LinkedIn or Website (optional)</Label>
        <Input type="url" name="linkedinUrl" placeholder="https://linkedin.com/in/yourname" />
      </div>

      {/* Message */}
      <div>
        <Label>Tell us about yourself</Label>
        <Textarea
          name="message"
          rows={4}
          maxLength={2000}
          placeholder="Briefly describe your background, why you're interested in joining Notar-E, and what you bring to the network."
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {pending ? "Submitting..." : "Submit Application"}
      </Button>

      <p className="text-center text-xs text-navy-400">
        By submitting you agree that Notar-E Services may contact you regarding opportunities.
      </p>
    </form>
  );
}
