import { Check } from "lucide-react";
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

export function PricingCard({ plan }: { plan: PricingPlanView }) {
  const suffix = plan.billingPeriod === "monthly" ? "/month" : "/appointment";
  return (
    <div
      className={cn(
        "flex flex-col rounded-3xl border p-8",
        plan.highlight
          ? "border-accent-500 bg-navy-900 text-white shadow-xl shadow-accent-500/20 lg:-translate-y-3"
          : "border-navy-100 bg-white"
      )}
    >
      {plan.highlight && (
        <span className="mb-4 inline-flex w-fit items-center rounded-full bg-accent-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
          Most Popular
        </span>
      )}
      <h3 className={cn("text-xl font-bold", plan.highlight ? "text-white" : "text-navy-900")}>{plan.name}</h3>
      <p className={cn("mt-2 text-sm", plan.highlight ? "text-navy-300" : "text-navy-500")}>{plan.description}</p>

      <div className="mt-6 flex items-baseline gap-1">
        <span className={cn("text-4xl font-extrabold tracking-tight", plan.highlight ? "text-white" : "text-navy-900")}>
          {formatCents(plan.totalCents, { showCents: false })}
        </span>
        <span className={cn("text-sm font-medium", plan.highlight ? "text-navy-300" : "text-navy-400")}>{suffix}</span>
      </div>

      <div
        className={cn(
          "mt-4 space-y-1.5 rounded-xl p-4 text-xs leading-relaxed",
          plan.highlight ? "bg-navy-800 text-navy-200" : "bg-navy-50 text-navy-500"
        )}
      >
        <p className="font-semibold uppercase tracking-wide text-[10px] opacity-80">Fee Breakdown</p>
        <p>
          Statutory notarial fee: <strong>{formatCents(plan.statutoryFeeCents, { showCents: false })}</strong> per act
          (Michigan-limited, MCL 55.287)
        </p>
        <p>
          {plan.serviceFeeLabel}: <strong>{formatCents(plan.serviceFeeCents, { showCents: false })}</strong>
        </p>
        {plan.appointmentsIncluded ? (
          <p>
            Includes up to <strong>{plan.appointmentsIncluded} appointments</strong>
            {plan.overageFeeCents ? (
              <> — additional appointments {formatCents(plan.overageFeeCents, { showCents: false })} each</>
            ) : null}
          </p>
        ) : plan.billingPeriod === "monthly" ? (
          <p>Unlimited qualifying appointments, subject to fair-use business terms</p>
        ) : null}
      </div>

      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check className={cn("mt-0.5 h-4 w-4 shrink-0", plan.highlight ? "text-accent-400" : "text-accent-600")} />
            <span className={plan.highlight ? "text-navy-100" : "text-navy-600"}>{f}</span>
          </li>
        ))}
      </ul>

      <LinkButton
        href={plan.billingPeriod === "monthly" ? "/contact" : "/book"}
        variant={plan.highlight ? "primary" : "dark"}
        size="lg"
        className="mt-8 w-full"
      >
        {plan.billingPeriod === "monthly" ? "Talk to Our Team" : "Book This Service"}
      </LinkButton>
    </div>
  );
}
