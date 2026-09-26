"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileUp, Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { CAREER_ROLES, EXPERIENCE_LEVELS, RESUME_MAX_BYTES, US_STATES } from "@/lib/careers";
import { cn } from "@/lib/utils";

type Opening = { id: string; title: string };

function Field({ label, error, children, hint, className }: { label: string; error?: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      {children}
      {error ? <p className="mt-1 text-xs font-medium text-danger-600">{error}</p> : hint ? <p className="mt-1 text-xs text-navy-400">{hint}</p> : null}
    </div>
  );
}

function Group({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-2xl border border-navy-100 p-5 sm:p-6">
      <legend className="flex items-center gap-2 px-1 text-sm font-bold text-navy-900">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-500 text-[11px] text-white">{n}</span>
        {title}
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function CareerApplicationForm({ openings, defaultRole }: { openings: Opening[]; defaultRole?: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [commissioned, setCommissioned] = useState<"" | "yes" | "no">("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const startedAt = useRef<number>(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    const form = new FormData(e.currentTarget);
    const file = form.get("resume");
    if (file && typeof file !== "string" && file.size > RESUME_MAX_BYTES) {
      setFieldErrors({ resume: "Max 3 MB" });
      return;
    }
    form.set("startedAt", String(startedAt.current));
    setSubmitting(true);
    try {
      const res = await fetch("/api/careers/apply", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setFieldErrors(data.fieldErrors ?? {});
        return;
      }
      setDone(true);
      window.scrollTo({ top: (document.getElementById("apply")?.offsetTop ?? 0) - 80, behavior: "smooth" });
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="animate-celebrate rounded-3xl border border-success-100 bg-success-100/40 p-10 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success-600" />
        <h3 className="mt-4 text-2xl font-bold text-navy-900">You&apos;re on our radar.</h3>
        <p className="mt-2 text-navy-500">Thanks for applying. We review every application and will reach out if there&apos;s a fit.</p>
      </div>
    );
  }

  const fe = fieldErrors;
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {/* Honeypot: hidden from people, tempting to bots. */}
      <div aria-hidden className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label>
          Company website
          <input type="text" name="company_website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Group n="1" title="About you">
        <Field label="First name" error={fe.firstName}><Input name="firstName" required autoComplete="given-name" /></Field>
        <Field label="Last name" error={fe.lastName}><Input name="lastName" required autoComplete="family-name" /></Field>
        <Field label="Email" error={fe.email}><Input name="email" type="email" required autoComplete="email" inputMode="email" /></Field>
        <Field label="Phone" error={fe.phone}><Input name="phone" type="tel" required autoComplete="tel" inputMode="tel" /></Field>
        <Field label="City" error={fe.city}><Input name="city" required autoComplete="address-level2" /></Field>
        <Field label="State" error={fe.state}>
          <Select name="state" defaultValue="MI" required>
            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
      </Group>

      <Group n="2" title="Role & experience">
        <Field label="Area of interest" error={fe.roleKey} className="sm:col-span-2">
          <Select name="roleKey" defaultValue={defaultRole ?? ""} required>
            <option value="" disabled>Choose one…</option>
            {CAREER_ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
            <option value="other">Other / Not sure</option>
          </Select>
        </Field>
        {openings.length > 0 && (
          <Field label="Applying for an open position?" className="sm:col-span-2">
            <Select name="jobOpeningId" defaultValue="">
              <option value="">No — general interest</option>
              {openings.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
            </Select>
          </Field>
        )}
        <Field label="Mobile notary experience" error={fe.mobileExperience}>
          <Select name="mobileExperience" defaultValue="none">{EXPERIENCE_LEVELS.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}</Select>
        </Field>
        <Field label="Remote online notarization" error={fe.ronExperience}>
          <Select name="ronExperience" defaultValue="none">{EXPERIENCE_LEVELS.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}</Select>
        </Field>
        <Field label="Signing-agent experience" error={fe.signingAgentExperience}>
          <Select name="signingAgentExperience" defaultValue="none">{EXPERIENCE_LEVELS.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}</Select>
        </Field>
        <Field label="Availability" error={fe.availability} hint="e.g. weekday evenings, weekends">
          <Input name="availability" maxLength={300} />
        </Field>
      </Group>

      <Group n="3" title="Notary commission">
        <div className="sm:col-span-2">
          <Label>Are you currently a commissioned notary?</Label>
          <div className="mt-1 grid grid-cols-2 gap-3">
            {(["yes", "no"] as const).map((v) => (
              <label
                key={v}
                className={cn(
                  "flex h-11 cursor-pointer items-center justify-center rounded-xl border-2 text-sm font-semibold transition-colors",
                  commissioned === v ? "border-accent-500 bg-accent-100/50 text-accent-700" : "border-navy-100 text-navy-600 hover:border-navy-200"
                )}
              >
                <input type="radio" name="isCommissioned" value={v} className="sr-only" checked={commissioned === v} onChange={() => setCommissioned(v)} required />
                {v === "yes" ? "Yes" : "Not yet"}
              </label>
            ))}
          </div>
          {fe.isCommissioned && <p className="mt-1 text-xs font-medium text-danger-600">{fe.isCommissioned}</p>}
        </div>
        {commissioned === "yes" && (
          <>
            <Field label="Commission state" error={fe.commissionState}>
              <Select name="commissionState" defaultValue="MI">{US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}</Select>
            </Field>
            <Field label="Commission expiration" error={fe.commissionExpiration}><Input name="commissionExpiration" type="date" /></Field>
          </>
        )}
      </Group>

      <Group n="4" title="Resume & links">
        <div className="sm:col-span-2">
          <Label>Resume (optional)</Label>
          <label
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-4 transition-colors",
              fe.resume ? "border-danger-500 bg-danger-100/30" : "border-navy-200 hover:border-accent-400 hover:bg-accent-100/20"
            )}
          >
            <FileUp className="h-5 w-5 shrink-0 text-accent-600" />
            <span className="min-w-0 flex-1 truncate text-sm text-navy-600">{fileName || "Upload PDF, DOC or DOCX · max 3 MB"}</span>
            {fileName && (
              <button
                type="button"
                aria-label="Remove file"
                onClick={(e) => {
                  e.preventDefault();
                  if (fileRef.current) fileRef.current.value = "";
                  setFileName("");
                }}
                className="text-navy-400 hover:text-danger-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              name="resume"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            />
          </label>
          {fe.resume && <p className="mt-1 text-xs font-medium text-danger-600">{fe.resume}</p>}
        </div>
        <Field label="LinkedIn or website (optional)" error={fe.linkedinUrl} className="sm:col-span-2">
          <Input name="linkedinUrl" type="url" inputMode="url" placeholder="https://" />
        </Field>
        <Field label="Anything else? (optional)" error={fe.message} className="sm:col-span-2">
          <Textarea name="message" rows={4} maxLength={2000} placeholder="A few lines about you" />
        </Field>
      </Group>

      {error && <p role="alert" className="rounded-xl bg-danger-100/60 p-3 text-sm font-medium text-danger-600">{error}</p>}

      <Button type="submit" size="lg" disabled={submitting} className="w-full shadow-lg shadow-accent-500/25">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Join the Notar-E Network
      </Button>
      <p className="text-center text-xs text-navy-400">
        Submitting doesn&apos;t guarantee a position. Your information is used only to review your application.
      </p>
    </form>
  );
}
