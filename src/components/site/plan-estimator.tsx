"use client";

import { useId, useState } from "react";
import { Calculator, Check } from "lucide-react";
import { formatCents } from "@/lib/money";
import { SUBSCRIPTION_PLAN_LIST, business30BreakEven, cheapestPlanFor, monthlyCostCents, overageUnits } from "@/lib/plans";
import { cn } from "@/lib/utils";

const money = (c: number) => formatCents(c, { showCents: false });

/**
 * Monthly-volume estimator for Business10 vs Business30. Pure arithmetic
 * from the plan catalog — no marketing claims: it shows both totals and
 * which is lower at the chosen volume, including where they cross over.
 */
export function PlanEstimator({ dark = false }: { dark?: boolean }) {
  const [volume, setVolume] = useState(15);
  const id = useId();
  const best = cheapestPlanFor(volume);
  const breakEven = business30BreakEven();
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
          const cost = monthlyCostCents(plan, volume);
          const extra = overageUnits(plan.includedNotarizations, volume);
          const isBest = best.key === plan.key;
          return (
            <div
              key={plan.key}
              aria-live="polite"
              className={cn(
                "relative rounded-2xl border p-4 transition-colors duration-300",
                isBest
                  ? "border-accent-500 bg-accent-500/10"
                  : dark
                    ? "border-white/10 bg-white/5"
                    : "border-navy-100 bg-navy-50/60"
              )}
            >
              {isBest && (
                <span className="absolute -top-2.5 right-3 inline-flex items-center gap-1 rounded-full bg-accent-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  <Check className="h-3 w-3" /> Lower cost
                </span>
              )}
              <p className={cn("text-sm font-semibold", dark ? "text-navy-200" : "text-navy-600")}>{plan.name}</p>
              <p className={cn("mt-1 text-3xl font-extrabold tabular-nums tracking-tight", dark ? "text-white" : "text-navy-900")}>{money(cost)}</p>
              <p className={cn("mt-1 text-xs", dark ? "text-navy-300" : "text-navy-500")}>
                {money(plan.monthlyCents)} base{extra > 0 ? ` + ${extra} × ${money(plan.overagePerNotarizationCents)}` : ` · ${plan.includedNotarizations - volume} left over`}
              </p>
            </div>
          );
        })}
      </div>

      <p className={cn("mt-5 text-xs leading-relaxed", dark ? "text-navy-300" : "text-navy-500")}>
        {Number.isFinite(breakEven) ? (
          <>Business30 costs less from <strong>{breakEven}</strong> notarizations a month; below that, Business10 costs less.</>
        ) : (
          <>At current rates Business10 plus {money(SUBSCRIPTION_PLAN_LIST[0].overagePerNotarizationCents)} per extra notarization costs less at any volume. Business30 gives a fixed monthly bill up to {SUBSCRIPTION_PLAN_LIST[1].includedNotarizations} notarizations.</>
        )}{" "}
        Estimates only; each notarization includes the $10 Michigan statutory fee.
      </p>
    </div>
  );
}
