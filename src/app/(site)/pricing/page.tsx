import type { Metadata } from "next";
import { Check, X } from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { PricingCard } from "@/components/site/pricing-card";
import { ComplianceNote } from "@/components/site/compliance-note";
import { getActivePricingPlans } from "@/lib/settings";
import { formatCents } from "@/lib/money";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Transparent Michigan notary pricing. Statutory notarial fees are always shown separately from lawful service charges.",
};

const COMPARISON_ROWS = (plans: Awaited<ReturnType<typeof getActivePricingPlans>>) => [
  { label: "Statutory notarial fee", values: plans.map((p) => `${formatCents(p.statutoryFeeCents, { showCents: false })}/act`) },
  { label: "Appointments included", values: plans.map((p) => (p.appointmentsIncluded ? `${p.appointmentsIncluded}/month` : p.billingPeriod === "monthly" ? "Unlimited*" : "1")) },
  { label: "Additional appointment rate", values: plans.map((p) => (p.overageFeeCents ? formatCents(p.overageFeeCents, { showCents: false }) : "—")) },
  { label: "In-person appointments", values: plans.map(() => true) },
  { label: "Remote/online (where eligible)", values: plans.map(() => true) },
  { label: "Priority scheduling", values: [false, true, true] },
  { label: "Centralized monthly invoicing", values: [false, true, true] },
  { label: "Dedicated point of contact", values: [false, true, true] },
  { label: "Usage dashboard", values: [false, true, true] },
];

export default async function PricingPage() {
  const plans = await getActivePricingPlans();
  const rows = COMPARISON_ROWS(plans);

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Pricing"
        title="Simple, transparent, Michigan-compliant pricing"
        description="Every package clearly separates the statutory notarial fee (capped at $10/act under Michigan law) from other lawful, disclosed service charges."
      />

      <div className="mt-14 grid gap-8 lg:grid-cols-3">
        {plans.map((plan) => (
          <PricingCard key={plan.key} plan={plan} />
        ))}
      </div>

      <ComplianceNote className="mt-12 mx-auto max-w-3xl" />

      <div className="mt-20">
        <h2 className="text-center text-2xl font-bold text-navy-900">Compare plans</h2>
        <div className="mt-8 overflow-x-auto rounded-2xl border border-navy-100">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="bg-navy-50">
                <th className="px-5 py-4 text-left font-semibold text-navy-500">Feature</th>
                {plans.map((p) => (
                  <th key={p.key} className="px-5 py-4 text-left font-semibold text-navy-900">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-navy-50/50"}>
                  <td className="px-5 py-4 font-medium text-navy-700">{row.label}</td>
                  {row.values.map((v, idx) => (
                    <td key={idx} className="px-5 py-4">
                      {typeof v === "boolean" ? (
                        v ? (
                          <Check className="h-4 w-4 text-success-600" />
                        ) : (
                          <X className="h-4 w-4 text-navy-300" />
                        )
                      ) : (
                        <span className="text-navy-700">{v}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-navy-400">
          *Unlimited plans are subject to fair-use business terms, available on request and editable
          by Notar-E Services as regulations or business needs evolve.
        </p>
      </div>
    </div>
  );
}
