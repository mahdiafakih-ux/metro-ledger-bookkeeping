"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { updatePortalProfile } from "@/lib/actions/portal";
import { buttonClasses } from "./ui";

const inputCls =
  "block w-full rounded-lg border border-navy-200 bg-white px-3 py-2.5 text-[15px] text-navy-950 placeholder:text-navy-300 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20";

export function ProfileForm({ initial }: { initial: { name: string; email: string; phone: string; company: string } }) {
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [company, setCompany] = useState(initial.company);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const dirty = name !== initial.name || phone !== initial.phone || company !== initial.company;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const res = await updatePortalProfile({ name, phone, company });
      if (!res.success) {
        setError(res.error);
        return;
      }
      toast.success("Profile updated");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 p-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="pf-name" className="mb-1.5 block text-[13px] font-medium text-navy-700">Full name</label>
          <input id="pf-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={200} required />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="pf-email" className="mb-1.5 block text-[13px] font-medium text-navy-700">Email</label>
          <div className="relative">
            <input id="pf-email" className={`${inputCls} bg-navy-50 pr-10 text-navy-500`} value={initial.email} readOnly aria-describedby="pf-email-help" />
            <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" aria-hidden />
          </div>
          <p id="pf-email-help" className="mt-1 text-xs text-navy-400">
            Your email is how you sign in. To change it, contact Notar-E support.
          </p>
        </div>
        <div>
          <label htmlFor="pf-phone" className="mb-1.5 block text-[13px] font-medium text-navy-700">Phone</label>
          <input id="pf-phone" type="tel" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" maxLength={30} />
        </div>
        <div>
          <label htmlFor="pf-company" className="mb-1.5 block text-[13px] font-medium text-navy-700">Company</label>
          <input id="pf-company" className={inputCls} value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" maxLength={200} />
        </div>
      </div>
      {error && <p role="alert" className="rounded-lg bg-danger-100 px-3 py-2 text-sm font-medium text-danger-600">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-navy-100 pt-4">
        <button
          type="button"
          disabled={!dirty || pending}
          onClick={() => { setName(initial.name); setPhone(initial.phone); setCompany(initial.company); setError(""); }}
          className={buttonClasses("ghost", "md")}
        >
          Reset
        </button>
        <button type="submit" disabled={!dirty || pending} className={buttonClasses("primary", "md")}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save changes
        </button>
      </div>
    </form>
  );
}
