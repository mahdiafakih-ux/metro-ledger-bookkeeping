"use client";

import { useId, useState } from "react";
import { Calculator, Check } from "lucide-react";
import { formatCents } from "@/lib/money";
import {
  BUSINESS10_MAX_MONTHLY_NOTARIZATIONS,
  SUBSCRIPTION_PLAN_LIST,
  applicablePlanFor,
  isPlanEligible,
  monthlyCostCents,
  overageUnits,
  planCapLabel,
} from "@/lib/plans";
import { cn } from "@/lib/utils";

const money = (c: number) => formatCents(c, { showCents: false });

/**
 * Monthly-volume estimator for Business10 vs Business30. Pure arithmetic
 * from the plan catalog. Business10 is only available up to
 * BUSINESS10_MAX_MONTHLY_NOTARIZATIONS a month: from 1 to that cap it can be
 * shown as the applicable plan; above it, it is shown as unavailable and
 * Business30 becomes the applicable plan.
 */
export function PlanEstimator({ dark = false }: { dark?: boolean }) {
  const [volume, setVolume] = useState(15);
  const id = useId();
  const applicable = applicablePlanFor(volume);
  const max = 60;

  return (
    <div
      className={cn(
        "rounded-3xl border p-6 sm:p-8",
        dark ? "border-white/10 bg-navy-900/80 text-white backdrop-blur-md" : "border-navy-100 bg-white shadow-[0_30px_80px_-40px_rgba(10,17,40,0.35)]"
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500 text-white shadow-lg shadow-accent-500/30">
          <Calculator className="h-5 w-5" />
        </span>
        <div>
          <p className={cn("text-lg font-bold", dark ? "text-white" : "text-navy-900")}>Estimate your month</p>
          <p className={cn("text-xs", dark ? "text-navy-300" : "text-navy-400")}>Drag to your typical notarization volume</p>
        </div>
      </div>

      <div className="mt-7">
        <div className="flex items-end justify-between">
          <label htmlFor={id} className={cn("text-sm font-medium", dark ? "text-navy-200" : "text-navy-600")}>
            Notarizations per month
          </label>
          <output htmlFor={id} className={cn("text-4xl font-extrabold tabular-nums tracking-tight", dark ? "text-white" : "text-navy-900")}>
            {volume}
          </output>
        </div>
        <input
          id={id}
          type="range"
          min={1}
          max={max}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="range-accent mt-3 w-full"
          style={{ ["--fill" as string]: `${((volume - 1) / (max - 1)) * 100}%` }}
        />
        <div className={cn("mt-1 flex justify-between text-[11px]", dark ? "text-navy-400" : "text-navy-400")}>
          <span>1</span>
          <span>{max}+</span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {SUBSCRIPTION_PLAN_LIST.map((plan) => {
          const eligible = isPlanEligible(plan, volume);
          const cost = monthlyCostCents(plan, volume);
          const extra = overageUnits(plan.includedNotarizations, volume);
          const isApplicable = applicable.key === plan.key;
          return (
            <div
              key={plan.key}
              aria-live="polite"
              aria-disabled={!eligible}
              data-plan={plan.key}
              data-eligible={eligible}
              className={cn(
                "relative rounded-2xl border p-4 transition-colors duration-300",
                isApplicable
                  ? "border-accent-500 bg-accent-500/10"
                  : dark
                    ? "border-white/10 bg-white/5"
                    : "border-navy-100 bg-navy-50/60",
                !eligible && "opacity-55"
              )}
            >
              {isApplicable && (
                <span className="absolute -top-2.5 right-3 inline-flex items-center gap-1 rounded-full bg-accent-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  <Check className="h-3 w-3" /> Your plan
                </span>
              )}
              <p className={cn("text-sm font-semibold", dark ? "text-navy-200" : "text-navy-600")}>{plan.name}</p>
              {eligible ? (
                <>
                  <p className={cn("mt-1 text-3xl font-extrabold tabular-nums tracking-tight", dark ? "text-white" : "text-navy-900")}>{money(cost)}</p>
                  <p className={cn("mt-1 text-xs", dark ? "text-navy-300" : "text-navy-500")}>
                    {money(plan.monthlyCents)} base{extra > 0 ? ` + ${extra} × ${money(plan.overagePerNotarizationCents)}` : ` · ${plan.includedNotarizations - volume} left over`}
                  </p>
                </>
              ) : (
                <>
                  <p className={cn("mt-1 text-lg font-bold", dark ? "text-navy-300" : "text-navy-500")}>Not available</p>
                  <p className={cn("mt-1 text-xs", dark ? "text-navy-300" : "text-navy-500")}>{planCapLabel(plan)}</p>
                </>
              )}
            </div>
          );
        })}
      </div>

      <p className={cn("mt-5 text-xs leading-relaxed", dark ? "text-navy-300" : "text-navy-500")}>
        {volume > BUSINESS10_MAX_MONTHLY_NOTARIZATIONS ? (
          <>
            Business10 is available up to <strong>{BUSINESS10_MAX_MONTHLY_NOTARIZATIONS}</strong> notarizations/month. At {volume} a month,{" "}
            <strong>{applicable.name}</strong> is your plan.
          </>
        ) : (
          <>
            Business10 is available up to <strong>{BUSINESS10_MAX_MONTHLY_NOTARIZATIONS}</strong> notarizations/month; above that, Business30 applies.
          </>
        )}{" "}
        Estimates only; each notarization includes the $10 Michigan statutory fee.
      </p>
    </div>
  );
}
