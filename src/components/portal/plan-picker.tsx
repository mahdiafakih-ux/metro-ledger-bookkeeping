"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/money";
import { SUBSCRIPTION_PLAN_LIST, monthlyCostCents, type SubscriptionPlanKey } from "@/lib/plans";
import { cn } from "@/lib/utils";

/**
 * Business10 / Business30 chooser for the client portal. Starts Stripe
 * Checkout when there is no subscription; switches plans (prorated) when
 * there is one. The $75 overage is disclosed on every card and must be
 * acknowledged before anything is charged.
 */
export function PlanPicker({
  businessId,
  currentPlanKey,
  hasActiveSubscription,
}: {
  businessId: string;
  currentPlanKey: string;
  hasActiveSubscription: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<SubscriptionPlanKey | null>(null);
  const [ack, setAck] = useState(false);

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
      <div className="grid gap-4 sm:grid-cols-2">
        {SUBSCRIPTION_PLAN_LIST.map((plan) => {
          const current = hasActiveSubscription && currentPlanKey === plan.key;
          return (
            <div
              key={plan.key}
              className={cn(
                "flex flex-col rounded-2xl border p-5 transition-shadow",
                current ? "border-accent-500 bg-accent-50 shadow-md shadow-accent-500/10" : "border-navy-100 bg-white hover:shadow-md"
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-lg font-bold text-navy-900">{plan.name}</p>
                {current && <span className="rounded-full bg-accent-500 px-2 py-0.5 text-[11px] font-bold uppercase text-white">Current</span>}
              </div>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-navy-900">
                {formatCents(plan.monthlyCents, { showCents: false })}
                <span className="text-sm font-medium text-navy-400">/mo</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-navy-600">
                <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-accent-600" /> {plan.includedNotarizations} notarizations included</li>
                <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-accent-600" /> {formatCents(plan.overagePerNotarizationCents, { showCents: false })} each after {plan.includedNotarizations}</li>
              </ul>
              <p className="mt-3 text-xs text-navy-400">
                e.g. {plan.includedNotarizations + 5} in a month = {formatCents(monthlyCostCents(plan, plan.includedNotarizations + 5), { showCents: false })}
              </p>
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
          I understand notarizations beyond my plan&apos;s monthly allowance are billed at <strong>$75 each</strong>, and that plan
          changes take effect immediately (Stripe prorates the monthly charge; notarizations already used this month keep their
          original terms).
        </span>
      </label>
      <p className="flex items-start gap-2 text-xs text-navy-400">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Each notarization includes the Michigan statutory notarial fee of $10 per act (MCL 55.285); the balance covers mobile or
        remote service, scheduling and administrative services.
      </p>
    </div>
  );
}
