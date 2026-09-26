import type { Metadata } from "next";
import {
  Building2,
  Scale,
  Home,
  Landmark,
  Car,
  Key,
  Banknote,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { SectionHeading } from "@/components/site/section-heading";
import { CostEstimator } from "@/components/site/cost-estimator";
import { getActivePricingPlans } from "@/lib/settings";
import { formatCents } from "@/lib/money";

export const metadata: Metadata = {
  title: "Business Notary Solutions | Business10 & Business30",
  description:
    "Dedicated notary services for title companies, law firms, real estate teams, dealerships, and more. Flat-rate monthly plans with mobile and remote online notarization.",
};

const WHO_WE_SERVE = [
  { icon: Building2, name: "Title Companies", desc: "Closing packages handled on your timeline." },
  { icon: Scale, name: "Law Firms", desc: "Affidavits, power of attorney, and legal filings." },
  { icon: Home, name: "Real Estate Agencies", desc: "Deeds, disclosures, and buyer paperwork." },
  { icon: Landmark, name: "Mortgage Companies", desc: "Loan documents and lender packages." },
  { icon: Car, name: "Auto Dealerships", desc: "Title transfers and vehicle purchase paperwork." },
  { icon: Key, name: "Property Management", desc: "Lease agreements and tenant documentation." },
  { icon: Banknote, name: "Financial Institutions", desc: "Bank forms and financial agreements." },
  { icon: Heart, name: "Healthcare Organizations", desc: "Patient directives and healthcare authorizations." },
];

const BENEFITS = [
  {
    title: "Priority Scheduling",
    desc: "No waiting. Your appointments are prioritized.",
  },
  {
    title: "Mobile & Online",
    desc: "Mobile notary and remote online notarization for eligible documents.",
  },
  {
    title: "Centralized Billing",
    desc: "One monthly invoice for your entire team.",
  },
  {
    title: "Usage Tracking",
    desc: "See how many appointments you've used this billing period.",
  },
  {
    title: "Client Portal",
    desc: "Manage appointments and billing in one place.",
  },
  {
    title: "Dedicated Support",
    desc: "A single point of contact for your notary needs.",
  },
];

export default async function BusinessSolutionsPage() {
  const allPlans = await getActivePricingPlans();
  const plans = allPlans.filter(
    (p) => p.billingPeriod === "monthly" && p.isActive && p.key !== "unlimited"
  );

  return (
    <>
      {/* Hero */}
      <section className="bg-navy-950 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-block rounded-full bg-accent-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-accent-300">
            Business Solutions
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Notarization that keeps up with your business.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-navy-200">
            Dedicated notary services for title companies, law firms, real estate teams,
            dealerships, and more.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex h-12 items-center rounded-xl bg-accent-500 px-7 text-base font-semibold text-white shadow-lg shadow-accent-500/30 transition hover:bg-accent-600"
            >
              Get Started
            </Link>
            <Link
              href="#pricing"
              className="inline-flex h-12 items-center rounded-xl border border-navy-600 px-7 text-base font-semibold text-white transition hover:bg-navy-800"
            >
              See Pricing ↓
            </Link>
          </div>
        </div>
      </section>

      {/* Who We Serve */}
      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Who We Serve"
            title="Built for every business that needs notarization"
          />
          <div className="mt-14 grid gap-5 grid-cols-2 lg:grid-cols-4">
            {WHO_WE_SERVE.map((item) => (
              <div
                key={item.name}
                className="flex flex-col items-center rounded-xl border border-navy-100 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-100 text-accent-600">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-bold text-navy-900">{item.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Plan Comparison */}
      <section id="pricing" className="bg-navy-50 px-4 py-20 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            eyebrow="Pricing"
            title="Simple, predictable pricing"
            description="One flat monthly fee. $75 per appointment after your included allowance."
          />
          <div className="mt-14 grid gap-8 sm:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.key}
                className={`relative flex flex-col rounded-2xl border p-8 ${
                  plan.highlight
                    ? "border-accent-500 bg-navy-900 text-white shadow-xl shadow-accent-500/20"
                    : "border-navy-200 bg-white"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-accent-500 px-4 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
                    Most Popular
                  </span>
                )}
                <h3
                  className={`text-xl font-bold ${
                    plan.highlight ? "text-white" : "text-navy-900"
                  }`}
                >
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span
                    className={`text-4xl font-extrabold tracking-tight ${
                      plan.highlight ? "text-white" : "text-navy-900"
                    }`}
                  >
                    {formatCents(plan.totalCents, { showCents: false })}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      plan.highlight ? "text-navy-300" : "text-navy-400"
                    }`}
                  >
                    /mo
                  </span>
                </div>
                <p
                  className={`mt-2 text-sm font-medium ${
                    plan.highlight ? "text-navy-300" : "text-navy-500"
                  }`}
                >
                  {plan.appointmentsIncluded} appointments/month
                </p>
                <p
                  className={`mt-1 text-xs ${
                    plan.highlight ? "text-navy-400" : "text-navy-400"
                  }`}
                >
                  $75 per additional appointment
                </p>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <span
                        className={`mt-0.5 shrink-0 text-base leading-none ${
                          plan.highlight ? "text-accent-400" : "text-accent-600"
                        }`}
                      >
                        ✓
                      </span>
                      <span className={plan.highlight ? "text-navy-100" : "text-navy-600"}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contact"
                  className={`mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl text-base font-semibold transition ${
                    plan.highlight
                      ? "bg-accent-500 text-white hover:bg-accent-600"
                      : "bg-navy-900 text-white hover:bg-navy-800"
                  }`}
                >
                  Talk to Our Team
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-navy-400 max-w-2xl mx-auto">
            Additional appointments beyond your included allowance are billed at $75 each.
            Statutory notarial fees (Michigan MCL 55.287: $10/act) are always disclosed separately.
          </p>
        </div>
      </section>

      {/* Interactive Cost Estimator */}
      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            eyebrow="Estimator"
            title="Estimate your monthly cost"
            description="See how the plans compare at your expected volume."
          />
          <div className="mt-12">
            <CostEstimator />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-navy-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Included"
            title="What's included with every business plan"
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm"
              >
                <h3 className="font-bold text-navy-900">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-500">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-accent-600 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to partner with Notar-E?
          </h2>
          <div className="mt-10">
            <Link
              href="/contact"
              className="inline-flex h-12 items-center rounded-xl bg-white px-8 text-base font-semibold text-accent-600 shadow-lg transition hover:bg-navy-50"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
