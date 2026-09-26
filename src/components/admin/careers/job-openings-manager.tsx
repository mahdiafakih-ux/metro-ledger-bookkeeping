"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea, FormField } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { CAREER_ROLES, CAREER_ROLE_LABELS } from "@/lib/careers";
import { createJobOpening, deleteJobOpening, setJobOpeningActive } from "@/lib/actions/careers";

type Opening = { id: string; title: string; roleKey: string; location: string; employment: string; isActive: boolean; applications: number };

export function JobOpeningsManager({ openings }: { openings: Opening[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", roleKey: "mobile_notary", location: "Metro Detroit, MI", employment: "Contract", summary: "" });

  const run = (fn: () => Promise<{ success: boolean; error?: string }>, ok: string, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (!res.success) toast.error(res.error ?? "Something went wrong");
      else {
        toast.success(ok);
        after?.();
        router.refresh();
      }
    });

  return (
    <div className="space-y-4">
      {openings.length === 0 ? (
        <p className="text-sm text-navy-400">No openings. The careers page currently shows &ldquo;Join our network&rdquo;.</p>
      ) : (
        <ul className="divide-y divide-navy-100 rounded-xl border border-navy-100">
          {openings.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="font-semibold text-navy-900">
                  {o.title} {!o.isActive && <Badge tone="neutral" className="ml-1">Hidden</Badge>}
                </p>
                <p className="text-xs text-navy-400">
                  {CAREER_ROLE_LABELS[o.roleKey] ?? o.roleKey} · {o.location} · {o.employment} · {o.applications} applicant{o.applications === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setJobOpeningActive(o.id, !o.isActive), o.isActive ? "Hidden from site" : "Now live on /careers")}>
                  {o.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {o.isActive ? "Hide" : "Publish"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Delete ${o.title}`}
                  disabled={pending}
                  onClick={() => {
                    if (window.confirm(`Delete "${o.title}"? Applications are kept.`)) run(() => deleteJobOpening(o.id), "Opening deleted");
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <form
          className="grid gap-3 rounded-xl border border-navy-100 p-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => createJobOpening(form as Parameters<typeof createJobOpening>[0]), "Opening published", () => {
              setAdding(false);
              setForm({ ...form, title: "", summary: "" });
            });
          }}
        >
          <FormField label="Title"><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Mobile Notary — Dearborn" /></FormField>
          <FormField label="Area">
            <Select value={form.roleKey} onChange={(e) => setForm({ ...form, roleKey: e.target.value })}>
              {CAREER_ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
              <option value="other">Other</option>
            </Select>
          </FormField>
          <FormField label="Location"><Input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></FormField>
          <FormField label="Type">
            <Select value={form.employment} onChange={(e) => setForm({ ...form, employment: e.target.value })}>
              <option>Contract</option>
              <option>Part-time</option>
              <option>Full-time</option>
            </Select>
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Summary (optional)"><Textarea rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></FormField>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={pending}>{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Publish opening</Button>
            <Button type="button" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add opening</Button>
      )}
    </div>
  );
}
