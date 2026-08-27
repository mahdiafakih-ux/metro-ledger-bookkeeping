"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Rocket } from "lucide-react";
import { NotareLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { completeSetup } from "@/lib/actions/setup";
import { DAY_NAMES } from "@/lib/constants";

const STEPS = ["Business Info", "Availability", "Revenue Goal", "Review"];

export default function SetupWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [businessName, setBusinessName] = useState("Notar-E Services");
  const [phone, setPhone] = useState("(313) 555-0142");
  const [email, setEmail] = useState("hello@notareservices.com");
  const [serviceArea, setServiceArea] = useState("Metro Detroit & Southeast Michigan");

  const [activeDays, setActiveDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("19:00");

  const [goalAmount, setGoalAmount] = useState(50000);
  const [goalDeadline, setGoalDeadline] = useState("2027-05-31");
  const [startingRevenue, setStartingRevenue] = useState(0);

  function toggleDay(day: number) {
    setActiveDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  }

  async function finish() {
    setSaving(true);
    await completeSetup({
      businessName,
      phone,
      email,
      serviceArea,
      activeDays,
      startTime,
      endTime,
      goalAmountDollars: goalAmount,
      goalDeadline,
      startingRevenueDollars: startingRevenue,
    });
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-navy-950 px-4 py-16">
      <div className="mx-auto max-w-xl">
        <div className="flex justify-center">
          <NotareLogo variant="light" size="lg" />
        </div>
        <p className="mt-4 text-center text-sm text-navy-300">
          Welcome! Let&apos;s get your Command Center set up in a couple of minutes.
        </p>

        <div className="mt-8 flex gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-accent-500" : "bg-navy-800"}`} />
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-navy-800 bg-navy-900 p-8">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Business Information</h2>
              <div>
                <Label className="text-navy-300">Business Name</Label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="!bg-navy-800 !border-navy-700 !text-white" />
              </div>
              <div>
                <Label className="text-navy-300">Business Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="!bg-navy-800 !border-navy-700 !text-white" />
              </div>
              <div>
                <Label className="text-navy-300">Business Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="!bg-navy-800 !border-navy-700 !text-white" />
              </div>
              <div>
                <Label className="text-navy-300">Service Area</Label>
                <Input value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} className="!bg-navy-800 !border-navy-700 !text-white" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Availability</h2>
              <div>
                <Label className="text-navy-300">Working Days</Label>
                <div className="flex flex-wrap gap-2">
                  {DAY_NAMES.map((name, i) => (
                    <button
                      key={name}
                      onClick={() => toggleDay(i)}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold ${activeDays.includes(i) ? "bg-accent-500 text-white" : "bg-navy-800 text-navy-400"}`}
                    >
                      {name.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-navy-300">Start Time</Label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="!bg-navy-800 !border-navy-700 !text-white" />
                </div>
                <div>
                  <Label className="text-navy-300">End Time</Label>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="!bg-navy-800 !border-navy-700 !text-white" />
                </div>
              </div>
              <p className="text-xs text-navy-400">Default appointment length is 20 minutes — fine-tune this anytime in Settings.</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Your Revenue Goal</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-navy-300">Goal Amount ($)</Label>
                  <Input type="number" value={goalAmount} onChange={(e) => setGoalAmount(Number(e.target.value))} className="!bg-navy-800 !border-navy-700 !text-white" />
                </div>
                <div>
                  <Label className="text-navy-300">Target Date</Label>
                  <Input type="date" value={goalDeadline} onChange={(e) => setGoalDeadline(e.target.value)} className="!bg-navy-800 !border-navy-700 !text-white" />
                </div>
              </div>
              <div>
                <Label className="text-navy-300">Starting Revenue Already Earned ($)</Label>
                <Input type="number" value={startingRevenue} onChange={(e) => setStartingRevenue(Number(e.target.value))} className="!bg-navy-800 !border-navy-700 !text-white" />
                <p className="mt-1 text-xs text-navy-400">If you&apos;ve already earned revenue toward this goal, enter it here to start your tracker accurately.</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Review & Launch</h2>
              <div className="space-y-2 text-sm text-navy-200">
                <p><strong>{businessName}</strong> — {serviceArea}</p>
                <p>{phone} · {email}</p>
                <p>Open {activeDays.length} days/week, {startTime}–{endTime}</p>
                <p>Goal: ${goalAmount.toLocaleString()} by {new Date(goalDeadline).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                <p>Starting balance: ${startingRevenue.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-navy-800 p-4 text-xs text-navy-300">
                Pricing (Individual $125 / Business 20 $2,500 / Unlimited $4,000) is pre-loaded with
                Michigan-compliant fee breakdowns. Payment integrations (Stripe) can be connected later
                in Settings without any code changes.
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" className="text-navy-300 hover:bg-navy-800" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              Back
            </Button>
            {step < 3 ? (
              <Button onClick={() => setStep((s) => s + 1)}>Continue</Button>
            ) : (
              <Button onClick={finish} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                Launch Command Center
              </Button>
            )}
          </div>
        </div>
        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-navy-500">
          <CheckCircle2 className="h-3.5 w-3.5" /> Demo data is pre-loaded so you can explore immediately — clear it anytime from Settings.
        </p>
      </div>
    </div>
  );
}
