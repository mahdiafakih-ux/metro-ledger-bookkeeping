import { ArrowRight, Check, ChevronDown, ShieldCheck } from "lucide-react";
import { formatCents } from "@/lib/money";
import { LinkButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PricingPlanView {
  key: string;
  name: string;
  billingPeriod: string;
  statutoryFeeCents: number;
  actsIncluded: number;
  serviceFeeCents: number;
  serviceFeeLabel: string;
  totalCents: number;
  appointmentsIncluded: number | null;
  overageFeeCents: number | null;
  description: string;
  features: string[];
  highlight: boolean;
}

// Honest, non-statistical labels (no "most popular" claims).
const TAGS: Record<string, string> = {
  individual: "Pay as you go",
  business10: "Best place to start",
  business30: "Largest allowance",
};

const money = (c: number) => formatCents(c, { showCents: false });

/**
 * Plan card used on the homepage, /pricing and /business-solutions.
 * Short on words; the Michigan statutory-fee split is always one tap away
 * (and summarised visibly on the card itself).
 */
export function PricingCard({ plan, ctaHref, ctaLabel }: { plan: PricingPlanView; ctaHref?: string; ctaLabel?: string }) {
  const monthly = plan.billingPeriod === "monthly";
  const dark = plan.highlight;
  const included = plan.appointmentsIncluded ?? plan.actsIncluded;
  const statutoryIncluded = plan.statutoryFeeCents * (monthly ? included : plan.actsIncluded);
  const serviceCents = plan.totalCents - statutoryIncluded;
  const tag = TAGS[plan.key];

  return (
    <div
      className={cn(
        "group/card relative flex h-full flex-col overflow-hidden rounded-3xl border p-7 transition-[transform,box-shadow] duration-500 sm:p-8",
        dark
          ? "border-accent-500/60 bg-navy-900 text-white shadow-2xl shadow-accent-500/25"
          : "border-navy-100 bg-white shadow-[0_20px_50px_-30px_rgba(10,17,40,0.35)] hover:-translate-y-1 hover:shadow-[0_40px_80px_-40px_rgba(35,84,235,0.45)]"
      )}
    >
      {dark && <div aria-hidden className="hero-orb -right-24 -top-24 h-72 w-72 [--orb:rgba(59,107,255,0.45)]" />}

      <div className="relative flex items-center justify-between gap-3">
        <h3 className={cn("text-xl font-bold tracking-tight", dark ? "text-white" : "text-navy-900")}>{plan.name}</h3>
        {tag && (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
              dark ? "bg-accent-500 text-white" : "bg-accent-100 text-accent-700"
            )}
          >
            {tag}
          </span>
        )}
      </div>
      <p className={cn("relative mt-1.5 text-sm", dark ? "text-navy-300" : "text-navy-500")}>{plan.description}</p>

      <div className="relative mt-6 flex items-baseline gap-1">
        <span className={cn("text-5xl font-extrabold tracking-tight", dark ? "text-white" : "text-navy-900")}>{money(plan.totalCents)}</span>
        <span className={cn("text-sm font-medium", dark ? "text-navy-300" : "text-navy-400")}>{monthly ? "/month" : "/appointment"}</span>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-2 text-center">
        <div className={cn("rounded-xl px-3 py-2.5", dark ? "bg-white/5" : "bg-navy-50")}>
          <p className={cn("text-lg font-bold", dark ? "text-white" : "text-navy-900")}>{monthly ? included : plan.actsIncluded}</p>
          <p className={cn("text-[11px] font-medium uppercase tracking-wide", dark ? "text-navy-300" : "text-navy-400")}>
            {monthly ? "Notarizations / mo" : "Act included"}
          </p>
        </div>
        <div className={cn("rounded-xl px-3 py-2.5", dark ? "bg-white/5" : "bg-navy-50")}>
          <p className={cn("text-lg font-bold", dark ? "text-white" : "text-navy-900")}>
            {monthly && plan.overageFeeCents ? money(plan.overageFeeCents) : money(plan.statutoryFeeCents)}
          </p>
          <p className={cn("text-[11px] font-medium uppercase tracking-wide", dark ? "text-navy-300" : "text-navy-400")}>
            {monthly ? `Each after ${included}` : "Each extra act"}
          </p>
        </div>
      </div>

      <ul className="relative mt-6 flex-1 space-y-2.5">
        {plan.features.slice(0, 5).map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check className={cn("mt-0.5 h-4 w-4 shrink-0", dark ? "text-accent-300" : "text-accent-600")} />
            <span className={dark ? "text-navy-100" : "text-navy-600"}>{f}</span>
          </li>
        ))}
      </ul>

      <details className={cn("group/fees relative mt-6 rounded-xl text-xs", dark ? "bg-white/5 text-navy-200" : "bg-navy-50 text-navy-500")}>
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
          <ShieldCheck className={cn("h-4 w-4 shrink-0", dark ? "text-accent-300" : "text-accent-600")} />
          <span className="flex-1">Includes {money(plan.statutoryFeeCents)}/act Michigan notarial fee</span>
          <ChevronDown className="h-4 w-4 transition-transform group-open/fees:rotate-180" />
        </summary>
        <div className="space-y-1.5 px-4 pb-4 leading-relaxed">
          <p className="flex justify-between gap-3">
            <span>Statutory notarial fee{monthly ? ` (${included} × ${money(plan.statutoryFeeCents)})` : ""}</span>
            <strong>{money(statutoryIncluded)}</strong>
          </p>
          <p className="flex justify-between gap-3">
            <span>{plan.serviceFeeLabel}</span>
            <strong>{money(serviceCents)}</strong>
          </p>
          {monthly && plan.overageFeeCents ? (
            <p className="flex justify-between gap-3">
              <span>Each extra notarization ({money(plan.statutoryFeeCents)} statutory + {money(plan.overageFeeCents - plan.statutoryFeeCents)} service)</span>
              <strong>{money(plan.overageFeeCents)}</strong>
            </p>
          ) : null}
          <p className="pt-1 opacity-80">Michigan caps the notarial-act fee at $10 per act (MCL 55.285). Other amounts are separate, disclosed services.</p>
        </div>
      </details>

      <LinkButton
        href={ctaHref ?? (monthly ? "/business-solutions#get-started" : "/book")}
        variant={dark ? "primary" : "dark"}
        size="lg"
        className="relative mt-6 w-full"
      >
        {ctaLabel ?? (monthly ? "Get Started" : "Book a Notary")} <ArrowRight className="h-4 w-4 transition-transform group-hover/card:translate-x-0.5" />
      </LinkButton>
    </div>
  );
}
