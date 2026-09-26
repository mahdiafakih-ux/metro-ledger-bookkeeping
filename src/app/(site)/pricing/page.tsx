import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { PricingCard } from "@/components/site/pricing-card";
import { PlanEstimator } from "@/components/site/plan-estimator";
import { ComplianceNote } from "@/components/site/compliance-note";
import { PageHero } from "@/components/site/page-hero";
import { SiteMotion } from "@/components/site/motion";
import { getActivePricingPlans } from "@/lib/settings";
import { formatCents } from "@/lib/money";

// Reads admin-editable plan copy from the database on every request rather
// than baking it into the build — also keeps this off Next's static
// prerender pass (a DB may not be reachable at build time on Vercel).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing — Individual, Business10 & Business30",
  description:
    "Transparent Michigan notary pricing: pay per appointment, or Business10 ($1,000/mo, 10 notarizations) and Business30 ($3,000/mo, 30 notarizations) with $75 per additional notarization. Statutory fees always itemized.",
  alternates: { canonical: "/pricing" },
};

type Plan = Awaited<ReturnType<typeof getActivePricingPlans>>[number];
const money = (c: number) => formatCents(c, { showCents: false });

const ROWS: { label: string; value: (p: Plan) => string | boolean }[] = [
  { label: "Price", value: (p) => `${money(p.totalCents)}${p.billingPeriod === "monthly" ? "/mo" : ""}` },
  { label: "Notarizations included", value: (p) => (p.billingPeriod === "monthly" ? `${p.appointmentsIncluded}/month` : `${p.actsIncluded} per appointment`) },
  { label: "Each additional", value: (p) => (p.billingPeriod === "monthly" && p.overageFeeCents ? money(p.overageFeeCents) : `${money(p.statutoryFeeCents)}/act`) },
  { label: "Statutory fee itemized", value: () => true },
  { label: "Mobile notary", value: () => true },
  { label: "Online (eligible documents)", value: () => true },
  { label: "Monthly invoice", value: (p) => p.billingPeriod === "monthly" },
  { label: "Portal usage tracking", value: (p) => p.billingPeriod === "monthly" },
];

export default async function PricingPage() {
  const plans = await getActivePricingPlans();

  return (
    <SiteMotion>
      <PageHero eyebrow="Pricing" title="Simple pricing." accent="No surprises." subtitle="Pay per appointment, or pick a monthly business plan." />

      <section className="relative z-10 -mt-12 px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3 lg:items-stretch">
          {plans.map((plan) => (
            <div key={plan.key} data-reveal className={plan.highlight ? "lg:-translate-y-3" : ""}>
              <PricingCard plan={plan} />
            </div>
          ))}
        </div>
        <ComplianceNote className="mx-auto mt-10 max-w-3xl" />
      </section>

      <section className="bg-navy-50 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div data-reveal>
            <SectionHeading align="left" eyebrow="Business plans" title="Which plan fits?" description="Slide to your monthly volume. The math does the rest." />
          </div>
          <div data-reveal>
            <PlanEstimator />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div data-reveal>
          <SectionHeading title="Compare plans" />
        </div>
        <div data-reveal className="mt-10 overflow-x-auto rounded-2xl border border-navy-100 bg-white">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="bg-navy-50">
                <th scope="col" className="px-4 py-4 text-left font-semibold text-navy-500 sm:px-5">&nbsp;</th>
                {plans.map((p) => (
                  <th key={p.key} scope="col" className="px-4 py-4 text-left font-bold text-navy-900 sm:px-5">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-navy-50/50"}>
                  <th scope="row" className="px-4 py-3.5 text-left font-medium text-navy-600 sm:px-5">
                    {row.label}
                  </th>
                  {plans.map((p) => {
                    const v = row.value(p);
                    return (
                      <td key={p.key} className="px-4 py-3.5 sm:px-5">
                        {typeof v === "boolean" ? (
                          v ? <Check className="h-4 w-4 text-success-600" aria-label="Included" /> : <Minus className="h-4 w-4 text-navy-300" aria-label="Not included" />
                        ) : (
                          <span className="font-semibold text-navy-800">{v}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-navy-400">
          Mobile travel fees are agreed before we travel. Online notarization is available for eligible documents and transactions.
        </p>
      </section>
    </SiteMotion>
  );
}
