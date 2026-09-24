"use client";

import { useEffect, useMemo, useState } from "react";
import { addDaysISO, detroitTodayISO } from "@/lib/tz";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Video,
  ArrowLeft,
  ArrowRight,
  Loader2,
  CalendarClock,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/form";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { submitBooking } from "@/lib/actions/booking";
import type { SlotOption } from "@/lib/availability";

const STEPS = ["Type", "Service", "Date & Time", "Your Details", "Document Info", "Review & Pay", "Confirmed"];

const SERVICE_TYPES = [
  "General Notary",
  "Real Estate Documents",
  "Affidavits",
  "Acknowledgments",
  "Jurats",
  "Power of Attorney",
  "Business Documents",
  "Vehicle Documents",
  "Financial Documents",
  "Estate Documents",
  "Other",
];

export function BookingWizard({
  statutoryFeePerActCents,
  serviceFeeCents,
  maxAdvanceDays,
}: {
  statutoryFeePerActCents: number;
  serviceFeeCents: number;
  maxAdvanceDays: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [appointmentType, setAppointmentType] = useState<"in_person" | "remote" | "">("");
  const [serviceType, setServiceType] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");

  const [documentType, setDocumentType] = useState("");
  const [numberOfActs, setNumberOfActs] = useState(1);
  const [notes, setNotes] = useState("");
  const [agreed, setAgreed] = useState(false);

  const todayISO = useMemo(() => detroitTodayISO(), []);
  const maxDateISO = useMemo(() => {
    return addDaysISO(detroitTodayISO(), maxAdvanceDays);
  }, [maxAdvanceDays]);

  /* eslint-disable react-hooks/set-state-in-effect -- resetting selection + fetching slots when the chosen date changes */
  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    setTime("");
    setLoadingSlots(true);
    fetch(`/api/availability?date=${date}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setSlots(d.slots ?? []);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const statutoryFeeCents = numberOfActs * statutoryFeePerActCents;
  const totalCents = statutoryFeeCents + serviceFeeCents;

  function canAdvance() {
    switch (step) {
      case 0: return !!appointmentType;
      case 1: return !!serviceType;
      case 2: return !!date && !!time;
      case 3: return name.length > 1 && /\S+@\S+\.\S+/.test(email) && phone.length > 6 && (appointmentType === "remote" || address.length > 3);
      case 4: return documentType.length > 1 && numberOfActs >= 1;
      case 5: return agreed;
      default: return true;
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    const res = await submitBooking({
      appointmentType: appointmentType as "in_person" | "remote",
      serviceType,
      documentType,
      numberOfActs,
      date,
      time,
      name,
      email,
      phone,
      company,
      address,
      notes,
    });
    setSubmitting(false);
    if (!res.success) {
      setError(res.error ?? "Something went wrong. Please try again.");
      return;
    }
    router.push(`/book/confirmation/${res.appointmentId}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-8 flex items-center gap-1.5">
        {STEPS.slice(0, 6).map((s, i) => (
          <div key={s} className="flex-1">
            <div className={`h-1.5 rounded-full ${i <= step ? "bg-accent-500" : "bg-navy-100"}`} />
          </div>
        ))}
      </div>
      <p className="mb-1 text-xs font-bold uppercase tracking-widest text-accent-600">
        Step {step + 1} of 6 — {STEPS[step]}
      </p>

      <div className="rounded-3xl border border-navy-100 bg-white p-6 shadow-sm sm:p-8">
        {step === 0 && (
          <div>
            <h2 className="text-xl font-bold text-navy-900">How would you like your appointment?</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { key: "in_person", label: "In-Person", desc: "We meet you at a convenient location.", icon: MapPin },
                { key: "remote", label: "Remote / Online", desc: "Available where legally eligible for your document.", icon: Video },
              ].map((opt: any) => (
                <button
                  key={opt.key}
                  onClick={() => setAppointmentType(opt.key as "in_person" | "remote")}
                  className={`rounded-2xl border-2 p-6 text-left transition-colors ${appointmentType === opt.key ? "border-accent-500 bg-accent-100/40" : "border-navy-100 hover:border-navy-200"}`}
                >
                  <opt.icon className="h-6 w-6 text-accent-600" />
                  <p className="mt-3 font-bold text-navy-900">{opt.label}</p>
                  <p className="mt-1 text-sm text-navy-500">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-navy-900">What type of service do you need?</h2>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SERVICE_TYPES.map((s) => (
                <button
                  key={s}
                  onClick={() => setServiceType(s)}
                  className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${serviceType === s ? "border-accent-500 bg-accent-100/40 text-accent-700" : "border-navy-100 text-navy-600 hover:border-navy-200"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-navy-900">Choose a date & time</h2>
            <div className="mt-6">
              <Label>Date</Label>
              <Input type="date" min={todayISO} max={maxDateISO} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            {date && (
              <div className="mt-6">
                <Label>Available Times</Label>
                {loadingSlots ? (
                  <div className="flex items-center gap-2 py-6 text-navy-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading availability...</div>
                ) : slots.length === 0 ? (
                  <p className="rounded-xl bg-navy-50 p-4 text-sm text-navy-500">
                    No openings on this date. Please try another date.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {slots.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setTime(s.value)}
                        className={`rounded-lg border-2 py-2 text-sm font-medium transition-colors ${time === s.value ? "border-accent-500 bg-accent-100/40 text-accent-700" : "border-navy-100 text-navy-600 hover:border-navy-200"}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {date && slots.length > 0 && (
              <p className="mt-4 flex items-start gap-2 text-xs text-navy-400">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                This time is held for you as you complete booking, but availability is not guaranteed
                until you receive your confirmation number at the end of this form.
              </p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-navy-900">Your details</h2>
            <div>
              <Label>Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(313) 555-0100" />
              </div>
            </div>
            <div>
              <Label>Company (optional)</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="If notarizing on behalf of a business" />
            </div>
            {appointmentType === "in_person" && (
              <div>
                <Label>Appointment Address</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Where should we meet you?" />
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-navy-900">Document information</h2>
            <div>
              <Label>Document Type / Description</Label>
              <Input value={documentType} onChange={(e) => setDocumentType(e.target.value)} placeholder="e.g. Power of Attorney form" />
            </div>
            <div>
              <Label>Number of Notarial Acts</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={numberOfActs}
                onChange={(e) => setNumberOfActs(Math.max(1, Number(e.target.value)))}
              />
              <p className="mt-1 text-xs text-navy-400">
                One notarial act = one signature notarized. Multiple signatures/documents may mean multiple acts.
              </p>
            </div>
            <div>
              <Label>Notes for your notary (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything we should know before your appointment?" />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-navy-900">Review & pricing</h2>
            <div className="rounded-xl border border-navy-100 p-5 text-sm">
              <div className="flex justify-between py-1"><span className="text-navy-500">Service</span><span className="font-medium text-navy-900">{serviceType}</span></div>
              <div className="flex justify-between py-1"><span className="text-navy-500">Appointment</span><span className="font-medium text-navy-900">{appointmentType === "remote" ? "Remote / Online" : "In-Person"}</span></div>
              <div className="flex justify-between py-1"><span className="text-navy-500">Date & Time</span><span className="font-medium text-navy-900">{date && formatDate(date)} {slots.find((s) => s.value === time)?.label}</span></div>
              <div className="flex justify-between py-1"><span className="text-navy-500">Notarial Acts</span><span className="font-medium text-navy-900">{numberOfActs}</span></div>
              <hr className="my-3 border-navy-100" />
              <div className="flex justify-between py-1"><span className="text-navy-500">Statutory notarial fee ({numberOfActs} × {formatCents(statutoryFeePerActCents, { showCents: false })})</span><span className="font-medium text-navy-900">{formatCents(statutoryFeeCents, { showCents: false })}</span></div>
              <div className="flex justify-between py-1"><span className="text-navy-500">Signing agent & service fee</span><span className="font-medium text-navy-900">{formatCents(serviceFeeCents, { showCents: false })}</span></div>
              <hr className="my-3 border-navy-100" />
              <div className="flex justify-between py-1 text-base"><span className="font-bold text-navy-900">Total Due</span><span className="font-bold text-navy-900">{formatCents(totalCents, { showCents: false })}</span></div>
            </div>
            <div className="rounded-xl bg-navy-50 p-4 text-xs leading-relaxed text-navy-500">
              Under Michigan law (MCL 55.287), the notarial act fee is capped at $10 per act. The
              remaining amount is a separately-disclosed fee for signing-agent time and administrative
              service — not part of the statutory notarization fee. Payment is collected at your
              appointment. Notar-E Services is not a law firm and does not provide legal advice.
            </div>
            <label className="flex items-start gap-2.5 text-sm text-navy-600">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-4 w-4 rounded border-navy-300" />
              I understand Notar-E Services is not a law firm, cannot provide legal advice, and the
              pricing above has been disclosed to me.
            </label>
            {error && <p className="text-sm font-medium text-danger-600">{error}</p>}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {step < 5 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canAdvance() || submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
              Confirm Booking
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
