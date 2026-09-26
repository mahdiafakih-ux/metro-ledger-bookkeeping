import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Car,
  FileCheck2,
  Home as HomeIcon,
  Landmark,
  LayoutDashboard,
  Receipt,
  Repeat,
  Scale,
  ShieldPlus,
  UserCheck,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { LinkButton } from "@/components/ui/button";
import { PricingCard } from "@/components/site/pricing-card";
import { PlanEstimator } from "@/components/site/plan-estimator";
import { BusinessInquiryForm } from "@/components/site/business-inquiry-form";
import { PageHero } from "@/components/site/page-hero";
import { SiteMotion } from "@/components/site/motion";
import { ComplianceNote } from "@/components/site/compliance-note";
import { getActivePricingPlans } from "@/lib/settings";
import { SUBSCRIPTION_PLAN_LIST } from "@/lib/plans";
import { formatCents } from "@/lib/money";

// Reads admin-editable plan copy from the database on every request (numbers
// come from the plan catalog) — also keeps this off Next's static prerender
// pass, which would otherwise run at build time before a DB is reachable.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Business Notary Plans — Business10 & Business30",
  description:
    "Monthly notary plans for Michigan title companies, lenders, law firms and real estate teams. Business10 and Business30 include monthly notarizations, one invoice, and mobile or eligible online notarization.",
  alternates: { canonical: "/business-solutions" },
};

const TARGETS = [
  { icon: Landmark, label: "Title Companies" },
  { icon: Building2, label: "Mortgage & Lending" },
  { icon: HomeIcon, label: "Real Estate" },
  { icon: Scale, label: "Law Firms" },
  { icon: Users, label: "Property Managers" },
  { icon: Car, label: "Dealerships" },
  { icon: ShieldPlus, label: "Banks & Credit Unions" },
  { icon: UserCheck, label: "Healthcare & Senior Living" },
];

// Only capabilities that exist in the product today.
const BENEFITS = [
  { icon: Receipt, title: "Centralized billing", desc: "One monthly invoice. Fees itemized." },
  { icon: BarChart3, title: "Usage tracking", desc: "Live notarization count in your portal." },
  { icon: LayoutDashboard, title: "Client portal", desc: "Plans, invoices and payments in one place." },
  { icon: FileCheck2, title: "Appointment management", desc: "Every signing on record." },
  { icon: Video, title: "Mobile + online", desc: "We come to you, or meet online for eligible documents." },
  { icon: Wallet, title: "Predictable base price", desc: "Flat monthly rate. $75 per extra notarization." },
];

const STEPS = [
  { n: "01", title: "Pick a plan", desc: "Business10 or Business30." },
  { n: "02", title: "Book signings", desc: "Mobile or online, whenever you need." },
  { n: "03", title: "One invoice", desc: "Track usage live. Switch plans anytime." },
];

const money = (c: number) => formatCents(c, { showCents: false });

export default async function BusinessSolutionsPage() {
  const allPlans = await getActivePricingPlans();
  const plans = allPlans.filter((p) => p.billingPeriod === "monthly");

  return (
    <SiteMotion>
      <PageHero eyebrow="Business Solutions" title="Your on-demand" accent="notary partner." subtitle="Monthly plans for teams that notarize every week.">
        <LinkButton href="#plans" size="lg" className="w-full shadow-lg shadow-accent-500/30 sm:w-auto">
          See Plans <ArrowRight className="h-4 w-4" />
        </LinkButton>
        <LinkButton href="#get-started" variant="outline" size="lg" className="w-full border-white/20 text-white hover:bg-white/10 sm:w-auto">
          Become a Business Partner
        </LinkButton>
      </PageHero>

      {/* Plan strip overlapping the hero */}
      <section className="relative z-10 -mt-10 px-4 sm:px-6 lg:px-8">
        <div data-stagger className="mx-auto grid max-w-4xl gap-3 rounded-3xl border border-white/70 bg-white/90 p-3 shadow-[0_40px_100px_-40px_rgba(10,17,40,0.45)] backdrop-blur-xl sm:grid-cols-2">
          {SUBSCRIPTION_PLAN_LIST.map((p) => (
            <a key={p.key} href="#plans" className="group flex items-center justify-between gap-4 rounded-2xl px-5 py-4 transition-colors hover:bg-navy-50">
              <div>
                <p className="text-sm font-bold text-navy-900">{p.name}</p>
                <p className="text-xs text-navy-500">{p.includedNotarizations} included · {money(p.overagePerNotarizationCents)} after</p>
              </div>
              <p className="text-2xl font-extrabold tracking-tight text-navy-900">
                {money(p.monthlyCents)}
                <span className="text-xs font-medium text-navy-400">/mo</span>
              </p>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <p data-reveal className="text-center text-xs font-bold uppercase tracking-[0.2em] text-navy-400">Built for</p>
        <div data-stagger className="mt-6 flex flex-wrap justify-center gap-2.5">
          {TARGETS.map((t) => (
            <span key={t.label} className="inline-flex items-center gap-2 rounded-full border border-navy-100 bg-white px-4 py-2 text-sm font-medium text-navy-700 shadow-sm">
              <t.icon className="h-4 w-4 text-accent-600" /> {t.label}
            </span>
          ))}
        </div>
      </section>

      <section className="bg-navy-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div data-reveal>
            <SectionHeading eyebrow="What you get" title="Everything in one place." />
          </div>
          <div data-stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                data-spotlight
                className="spotlight group relative overflow-hidden rounded-2xl border border-white bg-white p-6 shadow-[0_10px_30px_-18px_rgba(10,17,40,0.35)] transition-shadow duration-500 hover:shadow-[0_30px_60px_-25px_rgba(35,84,235,0.4)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-100 text-accent-600 transition-colors duration-300 group-hover:bg-accent-500 group-hover:text-white">
                  <b.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-bold text-navy-900">{b.title}</h3>
                <p className="mt-1 text-sm text-navy-500">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="plans" className="scroll-mt-20 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div data-reveal>
            <SectionHeading eyebrow="Plans" title="Pick a plan." />
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1fr_1.1fr] lg:items-stretch">
            {plans.map((plan) => (
              <div key={plan.key} data-reveal>
                <PricingCard plan={plan} ctaHref="#get-started" />
              </div>
            ))}
            <div data-reveal>
              <PlanEstimator />
            </div>
          </div>
          <ComplianceNote className="mx-auto mt-10 max-w-3xl" />
        </div>
      </section>

      <section className="bg-navy-950 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div data-reveal>
            <SectionHeading light eyebrow="How it works" title="Set up once. Notarize all month." />
          </div>
          <ol data-stagger className="mt-12 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-sm">
                <span aria-hidden className="pointer-events-none absolute -right-2 -top-6 select-none text-8xl font-extrabold text-white/5">
                  {s.n}
                </span>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-300">{s.n}</p>
                <p className="mt-2 text-xl font-bold text-white">{s.title}</p>
                <p className="mt-1 text-sm text-navy-300">{s.desc}</p>
              </li>
            ))}
          </ol>
          <p data-reveal className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-navy-300">
            <Repeat className="h-4 w-4 text-accent-300" /> Move between Business10 and Business30 from your client portal.
          </p>
        </div>
      </section>

      <section id="get-started" className="scroll-mt-20 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div data-reveal>
            <SectionHeading eyebrow="Get started" title="Become a Business Partner" description="Tell us your volume. We'll set up your account." />
          </div>
          <div data-reveal className="mt-10 rounded-3xl border border-navy-100 bg-white p-6 shadow-[0_30px_80px_-40px_rgba(10,17,40,0.35)] sm:p-10">
            <BusinessInquiryForm />
          </div>
        </div>
      </section>
    </SiteMotion>
  );
}
