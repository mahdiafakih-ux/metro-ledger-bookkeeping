"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Loader2,
  MapPin,
  Minus,
  MonitorSmartphone,
  Plus,
  Zap,
} from "lucide-react";
import { getPortalSlots, submitPortalRequest, type PortalRequestInput } from "@/lib/actions/portal";
import type { SlotOption } from "@/lib/availability";
import { addDaysISO, parseDateISO, weekdayOfDateISO } from "@/lib/tz";
import { formatCents } from "@/lib/money";
import { LEGAL_DISCLAIMER, PREFERENCE_DISCLAIMER } from "@/lib/portal/constants";
import { NotaryAvatar, Panel, buttonClasses } from "./ui";
import { cn } from "@/lib/utils";

export interface RequestNotaryOption {
  id: string;
  name: string;
  photoUrl: string;
  preferred: boolean;
  primary: boolean;
}

type Pricing =
  | { mode: "subscription"; planName: string }
  | { mode: "payg"; statutoryFeeCents: number; serviceFeeCents: number; serviceFeeLabel: string }
  | { mode: "unavailable" };

interface Props {
  todayISO: string;
  maxAdvanceDays: number;
  activeWeekdays: number[];
  blackoutDates: string[];
  vacationMessage: string;
  serviceTypes: string[];
  notaries: RequestNotaryOption[];
  initialNotaryId: string;
  defaultPhone: string;
  pricing: Pricing;
  supportPhone: string;
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function Section({ n, title, hint, children, id }: { n: number; title: string; hint?: string; children: React.ReactNode; id: string }) {
  return (
    <fieldset aria-labelledby={`${id}-legend`} className="border-t border-navy-100 px-5 py-6 first:border-t-0 sm:px-6">
      <div className="mb-4 flex items-baseline gap-3">
        <span aria-hidden className="tabular flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white">
          {n}
        </span>
        <div>
          <legend id={`${id}-legend`} className="text-[15px] font-semibold text-navy-950">
            {title}
          </legend>
          {hint && <p className="mt-0.5 text-[13px] text-navy-500">{hint}</p>}
        </div>
      </div>
      {children}
    </fieldset>
  );
}

function Choice({
  selected,
  onSelect,
  children,
  className,
  name,
  value,
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
  className?: string;
  name: string;
  value: string;
}) {
  return (
    <label
      className={cn(
        "relative flex cursor-pointer items-center rounded-lg border bg-white transition-[border-color,box-shadow,background-color] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent-500 has-[:focus-visible]:ring-offset-2",
        selected
          ? "border-accent-600 bg-accent-100/30 shadow-[0_0_0_1px_var(--color-accent-600)]"
          : "border-navy-200 hover:border-navy-300",
        className
      )}
    >
      <input type="radio" name={name} value={value} checked={selected} onChange={onSelect} className="sr-only" />
      {children}
    </label>
  );
}

const inputCls =
  "block w-full rounded-lg border border-navy-200 bg-white px-3 py-2.5 text-[15px] text-navy-950 placeholder:text-navy-300 transition-colors focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20";

export function RequestForm(props: Props) {
  const { pricing, notaries } = props;
  const [type, setType] = useState<"in_person" | "remote">("in_person");
  const [address, setAddress] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<SlotOption[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [documentType, setDocumentType] = useState("");
  const [acts, setActs] = useState(1);
  const [phone, setPhone] = useState(props.defaultPhone);
  const [notes, setNotes] = useState("");
  const initialPref = props.initialNotaryId ? "preferred" : "first_available";
  const [preference, setPreference] = useState<"first_available" | "preferred" | "no_preference">(initialPref);
  const [notaryId, setNotaryId] = useState(props.initialNotaryId || (notaries.find((n) => n.primary)?.id ?? ""));
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState<{ id: string; confirmation: string; when: string } | null>(null);
  const reqId = useRef(0);

  const dates = useMemo(() => {
    const out: { iso: string; wd: string; day: number; mon: string; ok: boolean }[] = [];
    const blackout = new Set(props.blackoutDates);
    for (let i = 0; i <= Math.min(props.maxAdvanceDays, 20); i++) {
      const iso = addDaysISO(props.todayISO, i);
      const p = parseDateISO(iso)!;
      const wd = weekdayOfDateISO(iso);
      out.push({ iso, wd: WEEKDAY_SHORT[wd], day: p.day, mon: MONTH_SHORT[p.month - 1], ok: props.activeWeekdays.includes(wd) && !blackout.has(iso) });
    }
    return out;
  }, [props.todayISO, props.maxAdvanceDays, props.activeWeekdays, props.blackoutDates]);
  const maxISO = addDaysISO(props.todayISO, props.maxAdvanceDays);

  // Load live slots whenever the date changes (latest request wins).
  useEffect(() => {
    if (!date) return;
    const id = ++reqId.current;
    let cancelled = false;
    (async () => {
      const result = await getPortalSlots(date);
      if (!cancelled && id === reqId.current) {
        setSlots(result);
        setSlotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date]);

  function chooseDate(iso: string) {
    if (iso === date) return;
    setDate(iso);
    setTime("");
    setSlots(null);
    setSlotsLoading(true);
  }

  const selectedNotary = notaries.find((n) => n.id === notaryId);
  const payg = pricing.mode === "payg" ? pricing : null;
  const estTotal = payg ? payg.statutoryFeeCents * acts + payg.serviceFeeCents : 0;

  function validate(): string {
    if (!serviceType) return "Choose a service.";
    if (type === "in_person" && address.trim().length < 5) return "Enter the address where the notary should meet you.";
    if (!date) return "Choose a date.";
    if (!time) return "Choose a time.";
    if (!documentType.trim()) return "Tell us what document(s) need notarizing.";
    if (preference === "preferred" && !notaryId) return "Choose which notary you'd like.";
    return "";
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    setError(v);
    if (v) {
      toast.error(v);
      return;
    }
    start(async () => {
      const res = await submitPortalRequest({
        appointmentType: type,
        serviceType: serviceType as PortalRequestInput["serviceType"],
        documentType,
        numberOfActs: acts,
        date,
        time,
        address: type === "remote" ? "" : address,
        phone,
        notes,
        notaryPreference: preference,
        preferredNotaryId: preference === "preferred" ? notaryId : "",
      });
      if (!res.success) {
        setError(res.error);
        toast.error(res.error);
        if (res.error.includes("taken")) {
          setTime("");
          setSlotsLoading(true);
          setSlots(await getPortalSlots(date));
          setSlotsLoading(false);
        }
        return;
      }
      const slot = slots?.find((s) => s.value === time);
      const d = dates.find((x) => x.iso === date);
      setDone({
        id: res.appointmentId,
        confirmation: res.confirmationNumber,
        when: `${d ? `${d.wd}, ${d.mon} ${d.day}` : date} at ${slot?.label ?? time}`,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (done) {
    return (
      <Panel className="portal-enter overflow-hidden">
        <div className="p-6 text-center sm:p-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-100 text-success-600">
            <CheckCircle2 className="h-6 w-6" aria-hidden />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-navy-950">Request received</h2>
          <p className="mt-1 text-[15px] text-navy-600">
            {serviceType} · {done.when}
          </p>
          <p className="tabular mt-4 inline-flex rounded-lg bg-navy-50 px-3 py-1.5 text-sm text-navy-600">
            Confirmation <span className="ml-1.5 font-semibold text-navy-950">{done.confirmation}</span>
          </p>
          {preference === "preferred" && selectedNotary && (
            <p className="mx-auto mt-5 max-w-md text-[13px] text-navy-500">
              You requested {selectedNotary.name.replace(/\.$/, "")}. {PREFERENCE_DISCLAIMER}
            </p>
          )}
          <p className="mx-auto mt-3 max-w-md text-[13px] text-navy-500">A confirmation email is on its way.</p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Link href={`/portal/appointments/${done.id}`} className={buttonClasses("primary", "md")}>
              View appointment
            </Link>
            <Link href="/portal/dashboard" className={buttonClasses("secondary", "md")}>
              Back to dashboard
            </Link>
          </div>
        </div>
      </Panel>
    );
  }

  if (props.vacationMessage || pricing.mode === "unavailable") {
    return (
      <Panel className="p-6 text-center">
        <p className="font-semibold text-navy-950">Online requests are paused</p>
        <p className="mt-1 text-sm text-navy-500">
          {props.vacationMessage || "Please contact us to schedule."} Call{" "}
          <a className="font-semibold text-accent-700" href={`tel:${props.supportPhone.replace(/[^\d+]/g, "")}`}>
            {props.supportPhone}
          </a>
          .
        </p>
      </Panel>
    );
  }

  let n = 0;
  return (
    <form onSubmit={submit} noValidate>
      <Panel className="overflow-hidden">
        <Section n={++n} id="where" title="Where do you need a notary?">
          <div className="grid grid-cols-2 gap-2">
            <Choice name="type" value="in_person" selected={type === "in_person"} onSelect={() => setType("in_person")} className="gap-3 p-3.5">
              <MapPin className="h-5 w-5 shrink-0 text-navy-500" aria-hidden />
              <span>
                <span className="block text-sm font-semibold text-navy-950">In person</span>
                <span className="block text-xs text-navy-500">We come to you</span>
              </span>
            </Choice>
            <Choice name="type" value="remote" selected={type === "remote"} onSelect={() => setType("remote")} className="gap-3 p-3.5">
              <MonitorSmartphone className="h-5 w-5 shrink-0 text-navy-500" aria-hidden />
              <span>
                <span className="block text-sm font-semibold text-navy-950">Remote / online</span>
                <span className="block text-xs text-navy-500">Where legally eligible</span>
              </span>
            </Choice>
          </div>
          {type === "in_person" ? (
            <div className="mt-3">
              <label htmlFor="req-address" className="mb-1.5 block text-[13px] font-medium text-navy-700">
                Service address
              </label>
              <input
                id="req-address"
                className={inputCls}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                autoComplete="street-address"
                placeholder="Street, city"
                maxLength={500}
              />
            </div>
          ) : (
            <p className="mt-3 text-[13px] text-navy-500">
              We&apos;ll confirm your document is eligible for remote notarization under Michigan law before the appointment.
            </p>
          )}
        </Section>

        <Section n={++n} id="service" title="Service">
          <div className="flex flex-wrap gap-2">
            {props.serviceTypes.map((s) => (
              <Choice key={s} name="service" value={s} selected={serviceType === s} onSelect={() => setServiceType(s)} className="px-3 py-2">
                <span className="text-sm font-medium text-navy-800">{s}</span>
              </Choice>
            ))}
          </div>
        </Section>

        <Section n={++n} id="when" title="Date & time" hint="All times are Eastern (Detroit).">
          <div className="-mx-5 overflow-x-auto px-5 pb-1 sm:-mx-6 sm:px-6">
            <div className="flex gap-2">
              {dates.map((d) => (
                <button
                  key={d.iso}
                  type="button"
                  disabled={!d.ok}
                  onClick={() => chooseDate(d.iso)}
                  aria-pressed={date === d.iso}
                  aria-label={`${d.wd} ${d.mon} ${d.day}${d.ok ? "" : " (unavailable)"}`}
                  className={cn(
                    "portal-press flex h-[68px] w-[56px] shrink-0 flex-col items-center justify-center rounded-lg border text-center transition-colors",
                    date === d.iso
                      ? "border-accent-600 bg-accent-600 text-white"
                      : "border-navy-200 bg-white text-navy-900 hover:border-navy-300",
                    !d.ok && "cursor-not-allowed border-dashed opacity-40"
                  )}
                >
                  <span className={cn("text-[11px] font-medium", date === d.iso ? "text-accent-100" : "text-navy-400")}>{d.wd}</span>
                  <span className="tabular text-lg font-semibold leading-tight">{d.day}</span>
                  <span className={cn("text-[10px]", date === d.iso ? "text-accent-100" : "text-navy-400")}>{d.mon}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-navy-400" aria-hidden />
            <label htmlFor="req-date" className="text-[13px] text-navy-500">
              Another date:
            </label>
            <input
              id="req-date"
              type="date"
              min={props.todayISO}
              max={maxISO}
              value={date}
              onChange={(e) => e.target.value && chooseDate(e.target.value)}
              className="rounded-md border border-navy-200 px-2 py-1 text-sm text-navy-900"
            />
          </div>

          {date && (
            <div className="mt-4" aria-live="polite">
              {slotsLoading ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="portal-skeleton h-10 rounded-lg" />
                  ))}
                </div>
              ) : slots && slots.length > 0 ? (
                <div role="radiogroup" aria-label="Available times" className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {slots.map((s) => (
                    <Choice key={s.value} name="time" value={s.value} selected={time === s.value} onSelect={() => setTime(s.value)} className="h-10 justify-center">
                      <span className="tabular text-sm font-semibold text-navy-900">{s.label}</span>
                    </Choice>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg bg-navy-50 px-4 py-3 text-sm text-navy-600">
                  No open times on this date. Try another day, or call {props.supportPhone} for urgent requests.
                </p>
              )}
            </div>
          )}
        </Section>

        <Section n={++n} id="details" title="Appointment details">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="req-doc" className="mb-1.5 block text-[13px] font-medium text-navy-700">
                Document(s) to notarize
              </label>
              <input
                id="req-doc"
                className={inputCls}
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                placeholder="e.g. Deed, affidavit, closing package"
                maxLength={200}
              />
            </div>
            <div>
              <span id="req-acts-label" className="mb-1.5 block text-[13px] font-medium text-navy-700">
                Estimated notarial acts
              </span>
              <div className="inline-flex items-center rounded-lg border border-navy-200" role="group" aria-labelledby="req-acts-label">
                <button type="button" aria-label="Fewer acts" onClick={() => setActs((a) => Math.max(1, a - 1))} className="flex h-10 w-10 items-center justify-center text-navy-600 hover:bg-navy-50 disabled:opacity-40" disabled={acts <= 1}>
                  <Minus className="h-4 w-4" />
                </button>
                <output aria-live="polite" className="tabular w-10 text-center font-semibold text-navy-950">
                  {acts}
                </output>
                <button type="button" aria-label="More acts" onClick={() => setActs((a) => Math.min(20, a + 1))} className="flex h-10 w-10 items-center justify-center text-navy-600 hover:bg-navy-50 disabled:opacity-40" disabled={acts >= 20}>
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-navy-400">One per signature/seal. Not sure? Leave it at 1.</p>
            </div>
            <div>
              <label htmlFor="req-phone" className="mb-1.5 block text-[13px] font-medium text-navy-700">
                Best phone for day-of contact
              </label>
              <input id="req-phone" type="tel" autoComplete="tel" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="req-notes" className="mb-1.5 block text-[13px] font-medium text-navy-700">
                Notes <span className="font-normal text-navy-400">(optional)</span>
              </label>
              <textarea
                id="req-notes"
                rows={3}
                className={inputCls}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Signer names, parking or access instructions, number of signers…"
                maxLength={2000}
              />
            </div>
          </div>
        </Section>

        <Section n={++n} id="notary" title="Notary preference">
          <div className="space-y-2" role="radiogroup" aria-label="Notary preference">
            <Choice name="pref" value="first_available" selected={preference === "first_available"} onSelect={() => setPreference("first_available")} className="gap-3 p-3.5">
              <Zap className="h-5 w-5 shrink-0 text-accent-600" aria-hidden />
              <span className="flex-1">
                <span className="block text-sm font-semibold text-navy-950">First available</span>
                <span className="block text-xs text-navy-500">Fastest — any Notar-E notary</span>
              </span>
              {preference === "first_available" && <Check className="h-4 w-4 text-accent-600" aria-hidden />}
            </Choice>
            {notaries.map((nt) => {
              const sel = preference === "preferred" && notaryId === nt.id;
              return (
                <Choice
                  key={nt.id}
                  name="pref"
                  value={`notary-${nt.id}`}
                  selected={sel}
                  onSelect={() => {
                    setPreference("preferred");
                    setNotaryId(nt.id);
                  }}
                  className="gap-3 p-3"
                >
                  <NotaryAvatar name={nt.name} photoUrl={nt.photoUrl} size={32} />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-navy-950">{nt.name}</span>
                    <span className="block text-xs text-navy-500">
                      {nt.primary ? "Primary preferred notary" : nt.preferred ? "Preferred" : "Worked with you before"}
                    </span>
                  </span>
                  {sel && <Check className="h-4 w-4 text-accent-600" aria-hidden />}
                </Choice>
              );
            })}
            <Choice name="pref" value="no_preference" selected={preference === "no_preference"} onSelect={() => setPreference("no_preference")} className="gap-3 p-3.5">
              <span className="flex-1">
                <span className="block text-sm font-semibold text-navy-950">No preference</span>
              </span>
              {preference === "no_preference" && <Check className="h-4 w-4 text-accent-600" aria-hidden />}
            </Choice>
          </div>
          {preference === "preferred" && <p className="mt-3 text-[13px] text-navy-500">{PREFERENCE_DISCLAIMER}</p>}
        </Section>

        <div className="border-t border-navy-100 bg-navy-50/60 px-5 py-5 sm:px-6">
          {pricing.mode === "subscription" ? (
            <div className="text-sm">
              <p className="font-semibold text-navy-950">Submitted under your {pricing.planName} plan</p>
              <p className="mt-1 text-[13px] text-navy-500">
                Any applicable Michigan statutory notarial-act fees are recorded separately after the appointment based on the acts actually performed.
              </p>
            </div>
          ) : payg ? (
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-navy-500">
                  Statutory notarial fee · {acts} act{acts === 1 ? "" : "s"} × {formatCents(payg.statutoryFeeCents)}
                </dt>
                <dd className="tabular text-navy-800">{formatCents(payg.statutoryFeeCents * acts)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-navy-500">{payg.serviceFeeLabel} (non-notarial)</dt>
                <dd className="tabular text-navy-800">{formatCents(payg.serviceFeeCents)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-navy-200 pt-2 font-semibold text-navy-950">
                <dt>Estimated total</dt>
                <dd className="tabular">{formatCents(estTotal)}</dd>
              </div>
              <p className="pt-1 text-xs text-navy-400">Final notarial fees reflect the acts actually performed. Pay online after booking or at your appointment.</p>
            </dl>
          ) : null}
        </div>
      </Panel>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 mt-4 lg:static">
        {error && (
          <p role="alert" className="mb-2 rounded-lg bg-danger-100 px-3 py-2 text-sm font-medium text-danger-600">
            {error}
          </p>
        )}
        <button type="submit" disabled={pending} className={cn(buttonClasses("primary", "lg"), "w-full shadow-[0_8px_24px_-8px_rgba(35,84,235,0.55)] lg:shadow-none")}>
          {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Check className="h-5 w-5" aria-hidden />}
          {pending ? "Submitting…" : "Submit request"}
        </button>
      </div>
      <p className="mt-4 text-center text-xs text-navy-400">{LEGAL_DISCLAIMER}</p>
    </form>
  );
}
