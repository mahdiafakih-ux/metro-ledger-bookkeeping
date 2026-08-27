import type { Metadata } from "next";
import {
  ArrowRight,
  Building2,
  Landmark,
  Home as HomeIcon,
  Scale,
  Car,
  Users,
  ShieldPlus,
  CalendarCheck,
  Receipt,
  BarChart3,
  Repeat,
  Zap,
  UserCheck,
} from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { LinkButton } from "@/components/ui/button";
import { PricingCard } from "@/components/site/pricing-card";
import { BusinessInquiryForm } from "@/components/site/business-inquiry-form";
import { getActivePricingPlans } from "@/lib/settings";

// Reads admin-editable pricing plans from the database on every request
// rather than baking them into the build — also keeps this off Next's
// static prerender pass, which would otherwise run at build time (before a
// database may even be reachable, e.g. a fresh Vercel deploy).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Business Notary Solutions",
  description:
    "On-demand notary service for title companies, mortgage companies, real estate professionals, law firms, property managers, dealerships, and financial institutions across Michigan.",
};

const TARGETS = [
  { icon: Landmark, label: "Title Companies" },
  { icon: Building2, label: "Mortgage Companies" },
  { icon: HomeIcon, label: "Real Estate Professionals" },
  { icon: Scale, label: "Law Firms" },
  { icon: Users, label: "Property Managers" },
  { icon: Car, label: "Dealerships" },
  { icon: ShieldPlus, label: "Financial Organizations" },
  { icon: UserCheck, label: "Healthcare Organizations" },
];

const BENEFITS = [
  { icon: CalendarCheck, title: "Priority Scheduling", desc: "Your appointments jump the queue — no more waiting days for a notary." },
  { icon: Receipt, title: "Centralized Billing", desc: "One clean monthly invoice instead of tracking receipts across appointments." },
  { icon: Zap, title: "Fast Response Times", desc: "Most requests confirmed same-day, with in-person and remote options." },
  { icon: Users, title: "Dedicated Service", desc: "A consistent point of contact who understands your document flow." },
  { icon: BarChart3, title: "Usage Tracking", desc: "See exactly how many appointments you've used, right in your account." },
  { icon: Repeat, title: "Recurring Service", desc: "Set it and forget it — regular signings without repeat scheduling." },
];

export default async function BusinessSolutionsPage() {
  const allPlans = await getActivePricingPlans();
  const plans = allPlans.filter((p) => p.billingPeriod === "monthly");

  return (
    <>
      <section className="bg-navy-950 py-24">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-accent-300">Business Solutions</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Your On-Demand Notary Partner
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-navy-200">
            Stop searching for a notary every time you need one. Notar-E Services becomes an
            extension of your team — with priority scheduling, simple monthly invoicing, and fast
            turnaround for every closing, signing, and document.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LinkButton href="#inquiry" size="lg">
              Become a Business Partner <ArrowRight className="h-4 w-4" />
            </LinkButton>
            <LinkButton href="#pricing" variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
              View Business Pricing
            </LinkButton>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Who We Serve" title="Built for organizations with frequent document needs" />
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {TARGETS.map((t) => (
            <div key={t.label} className="flex flex-col items-center gap-3 rounded-2xl border border-navy-100 p-6 text-center">
              <t.icon className="h-6 w-6 text-accent-600" />
              <p className="text-sm font-semibold text-navy-800">{t.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-navy-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Why Partner With Us"
            title="Everything your team needs, without the overhead"
            description="No more calling around, negotiating one-off rates, or waiting on availability. We handle the logistics — you focus on closing business."
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div key={b.title} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-100 text-accent-600">
                  <b.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-bold text-navy-900">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-500">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 scroll-mt-20">
        <SectionHeading
          eyebrow="Business Pricing"
          title="Plans built for volume"
          description="Statutory notarial fees are always disclosed separately from your service plan, per Michigan law."
        />
        <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:max-w-4xl lg:mx-auto">
          {plans.map((plan) => (
            <PricingCard key={plan.key} plan={plan} />
          ))}
        </div>
      </section>

      <section id="inquiry" className="bg-navy-950 py-24 scroll-mt-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            light
            eyebrow="Get Started"
            title="Let's build a plan around your volume"
            description="Tell us about your business and we'll recommend the right plan — including custom terms for high-volume partners."
          />
          <div className="mt-10 rounded-3xl border border-navy-800 bg-navy-900 p-8 sm:p-10">
            <BusinessInquiryForm />
          </div>
        </div>
      </section>
    </>
  );
}
