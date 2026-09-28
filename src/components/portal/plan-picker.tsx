"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import {
  ENTERPRISE_OFFER,
  SUBSCRIPTION_PLAN_LIST,
  cheapestPlanFor,
  monthlyCostCents,
  savingsVersus,
  suggestsEnterprise,
  type SubscriptionPlanKey,
} from "@/lib/plans";
import { cn } from "@/lib/utils";

/**
 * Business10 / Business30 chooser for the client portal. Starts Stripe
 * Checkout when there is no subscription; switches plans (prorated) when
 * there is one. The overage rate is disclosed on every card and must be
 * acknowledged before anything is charged.
 *
 * The volume input only drives a cost comparison and a "Recommended" badge
 * (whichever plan costs less at that volume). Both plans can always be
 * chosen; nothing here or on the server restricts a plan by volume.
 */
const money = (c: number) => formatCents(c, { showCents: false });
const OVERAGE_CENTS = SUBSCRIPTION_PLAN_LIST[0].overagePerNotarizationCents;

export function PlanPicker({
  businessId,
  currentPlanKey,
  hasActiveSubscription,
  knownMonthlyVolume = 0,
}: {
  businessId: string;
  currentPlanKey: string;
  hasActiveSubscription: boolean;
  /** Highest monthly volume on record; used as the estimate's starting value. */
  knownMonthlyVolume?: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<SubscriptionPlanKey | null>(null);
  const [ack, setAck] = useState(false);
  const [volume, setVolume] = useState(knownMonthlyVolume > 0 ? knownMonthlyVolume : 10);
  const recommended = cheapestPlanFor(volume);

  async function choose(planKey: SubscriptionPlanKey) {
    if (!ack) {
      toast.error("Please confirm the overage terms first.");
      return;
    }
    setBusy(planKey);
    try {
      const res = await fetch(hasActiveSubscription ? "/api/subscription/change" : "/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hasActiveSubscription ? { businessId, planKey } : { businessId, planType: planKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Something went wrong");
        return;
      }
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      toast.success("Plan updated. Stripe will prorate this month's charge.");
      router.refresh();
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <label className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy-100 bg-white p-4 text-sm">
        <span>
          <span className="block font-semibold text-navy-900">Typical notarizations per month</span>
          <span className="block text-xs text-navy-400">We&apos;ll recommend the plan that costs less. You can pick either one.</span>
        </span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={10000}
          value={volume}
          onChange={(e) => setVolume(Math.min(10000, Math.max(0, Math.floor(Number(e.target.value) || 0))))}
          aria-label="Typical notarizations per month"
          className="h-11 w-24 rounded-lg border border-navy-200 px-3 text-right text-base font-semibold tabular-nums text-navy-900"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        {SUBSCRIPTION_PLAN_LIST.map((plan) => {
          const current = hasActiveSubscription && currentPlanKey === plan.key;
          const isRecommended = recommended.key === plan.key;
          const extraCost = savingsVersus(plan, volume);
          return (
            <div
              key={plan.key}
              data-plan={plan.key}
              data-recommended={isRecommended}
              className={cn(
                "flex flex-col rounded-2xl border p-5 transition-shadow",
                current ? "border-accent-500 bg-accent-50 shadow-md shadow-accent-500/10" : "border-navy-100 bg-white hover:shadow-md"
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-lg font-bold text-navy-900">{plan.name}</p>
                <span className="flex gap-1.5">
                  {isRecommended && (
                    <span className="rounded-full bg-success-100 px-2 py-0.5 text-[11px] font-bold uppercase text-success-600">Recommended</span>
                  )}
                  {current && <span className="rounded-full bg-accent-500 px-2 py-0.5 text-[11px] font-bold uppercase text-white">Current</span>}
                </span>
              </div>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-navy-900">
                {formatCents(plan.monthlyCents, { showCents: false })}
                <span className="text-sm font-medium text-navy-400">/mo</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-navy-600">
                <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-accent-600" /> {plan.includedNotarizations} notarizations included</li>
                <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-accent-600" /> {formatCents(plan.overagePerNotarizationCents, { showCents: false })} each after {plan.includedNotarizations}</li>
              </ul>
              <p className="mt-3 text-sm text-navy-600">
                At {volume}/month: <strong className="tabular-nums text-navy-900">{money(monthlyCostCents(plan, volume))}</strong>
              </p>
              {!isRecommended && extraCost > 0 && (
                <p className="mt-1 text-xs text-navy-400">{money(extraCost)}/mo more than {recommended.name} at this volume</p>
              )}
              <Button
                className="mt-5 w-full"
                variant={current ? "subtle" : "primary"}
                disabled={current || busy !== null}
                onClick={() => choose(plan.key)}
              >
                {busy === plan.key && <Loader2 className="h-4 w-4 animate-spin" />}
                {current ? "Your plan" : hasActiveSubscription ? `Switch to ${plan.name}` : `Start ${plan.name}`}
              </Button>
            </div>
          );
        })}
      </div>

      <label className="flex items-start gap-3 rounded-xl border border-navy-100 bg-white p-4 text-sm text-navy-600">
        <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded border-navy-300" />
        <span>
          I understand notarizations beyond my plan&apos;s monthly allowance are billed at <strong>{money(OVERAGE_CENTS)} each</strong>, and that plan
          changes take effect immediately (Stripe prorates the monthly charge; notarizations already used this month keep their
          original terms).
        </span>
      </label>
      {suggestsEnterprise(volume) && (
        <p className="rounded-xl border border-navy-100 bg-navy-50/60 p-4 text-sm text-navy-600">
          Around {ENTERPRISE_OFFER.suggestedMinMonthlyNotarizations}+ a month?{" "}
          <a href={ENTERPRISE_OFFER.ctaHref} className="font-semibold text-accent-600 hover:underline">
            Ask us for an {ENTERPRISE_OFFER.name} quote
          </a>
          .
        </p>
      )}
      <p className="flex items-start gap-2 text-xs text-navy-400">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Each notarization includes the Michigan statutory notarial fee of $10 per act (MCL 55.285); the balance covers mobile or
        remote service, scheduling and administrative services.
      </p>
    </div>
  );
}
