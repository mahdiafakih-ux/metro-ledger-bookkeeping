import Link from "next/link";
import {
  Zap,
  ShieldCheck,
  CalendarClock,
  Building2,
  ArrowRight,
  FileSignature,
  Landmark,
  Car,
  Scale,
  Home as HomeIcon,
  CheckCircle2,
} from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { SectionHeading } from "@/components/site/section-heading";
import { PricingCard } from "@/components/site/pricing-card";
import { getActivePricingPlans, getBusinessSettings } from "@/lib/settings";
import { NotareIcon } from "@/components/brand/logo";

export default async function HomePage() {
  const [plans, settings] = await Promise.all([getActivePricingPlans(), getBusinessSettings()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NotaryPublic",
    name: settings.businessName,
    telephone: settings.phone,
    email: settings.email,
    areaServed: settings.serviceArea,
    address: { "@type": "PostalAddress", addressRegion: "MI", addressCountry: "US" },
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  };

  const trustItems = [
    { icon: Zap, label: "Fast Appointments", sub: "~20 minutes, on your schedule" },
    { icon: ShieldCheck, label: "Michigan Commissioned", sub: "Bonded & insured notary" },
    { icon: CalendarClock, label: "Convenient Scheduling", sub: "Book online in minutes" },
    { icon: FileSignature, label: "Secure Service", sub: "Confidential document handling" },
    { icon: Building2, label: "Individual & Business", sub: "Solutions for every client" },
  ];

  const serviceCategories = [
    { icon: HomeIcon, label: "Real Estate Documents" },
    { icon: Scale, label: "Power of Attorney" },
    { icon: Landmark, label: "Financial Documents" },
    { icon: Car, label: "Vehicle Documents" },
    { icon: FileSignature, label: "Affidavits & Jurats" },
    { icon: Building2, label: "Business Documents" },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-950">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(59,107,255,0.35), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 flex justify-center">
              <NotareIcon size={56} />
            </div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-accent-300">
              {settings.serviceArea}
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
              {settings.heroHeadline}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-navy-200 sm:text-xl">
              {settings.heroSubheadline}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <LinkButton href="/book" size="lg" className="w-full sm:w-auto">
                Book an Appointment <ArrowRight className="h-4 w-4" />
              </LinkButton>
              <LinkButton href="/business-solutions" variant="outline" size="lg" className="w-full border-white/20 text-white hover:bg-white/10 sm:w-auto">
                Business Solutions
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b border-navy-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-12 sm:px-6 md:grid-cols-5 lg:px-8">
          {trustItems.map((item) => (
            <div key={item.label} className="flex flex-col items-center text-center gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-100 text-accent-600">
                <item.icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-navy-900">{item.label}</p>
              <p className="text-xs text-navy-400">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How It Works"
          title="Three steps to a notarized document"
          description="No phone tag, no waiting rooms — just a fast, professional appointment when you need it."
        />
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {[
            { step: "01", title: "Book Online", desc: "Choose in-person or remote, pick a time that works, and enter your document details in under two minutes." },
            { step: "02", title: "Meet Your Notary", desc: "We come to you, meet you at a convenient location, or connect remotely — appointments take about 20 minutes." },
            { step: "03", title: "Get Notarized", desc: "Sign, verify ID, and you're done. Receive your confirmation and receipt immediately." },
          ].map((s) => (
            <div key={s.step} className="rounded-2xl border border-navy-100 p-8">
              <span className="text-3xl font-extrabold text-accent-200">{s.step}</span>
              <h3 className="mt-3 text-lg font-bold text-navy-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services preview */}
      <section className="bg-navy-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="What We Notarize"
            title="Document categories we handle every day"
          />
          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {serviceCategories.map((c) => (
              <div key={c.label} className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center shadow-sm">
                <c.icon className="h-6 w-6 text-accent-600" />
                <p className="text-sm font-medium text-navy-700">{c.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <LinkButton href="/services" variant="outline" size="md">
              View All Services <ArrowRight className="h-4 w-4" />
            </LinkButton>
          </div>
        </div>
      </section>

      {/* Business teaser */}
      <section className="bg-navy-950 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <SectionHeading
              align="left"
              light
              eyebrow="For Businesses"
              title="Your On-Demand Notary Partner"
              description="Title companies, law firms, real estate teams, and dealerships trust Notar-E Services so they never have to search for a notary again."
            />
            <ul className="mt-8 space-y-3">
              {["Priority scheduling", "Centralized monthly billing", "Dedicated point of contact", "Usage tracking & reporting", "Recurring service plans"].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-navy-100">
                  <CheckCircle2 className="h-5 w-5 text-accent-400" />
                  {f}
                </li>
              ))}
            </ul>
            <LinkButton href="/business-solutions" size="lg" className="mt-8">
              Explore Business Solutions <ArrowRight className="h-4 w-4" />
            </LinkButton>
          </div>
          <div className="flex items-center justify-center rounded-3xl border border-navy-800 bg-navy-900 p-10">
            <div className="w-full space-y-4">
              {[
                { label: "Business 20", desc: "Up to 20 appointments / month", price: "$2,500/mo" },
                { label: "Business Unlimited", desc: "Unlimited qualifying appointments*", price: "$4,000/mo" },
              ].map((p) => (
                <div key={p.label} className="rounded-xl bg-navy-800 p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">{p.label}</p>
                    <p className="font-bold text-accent-300">{p.price}</p>
                  </div>
                  <p className="mt-1 text-xs text-navy-300">{p.desc}</p>
                </div>
              ))}
              <p className="text-[11px] text-navy-400">
                *Subject to fair-use business terms. Statutory notarial fees always disclosed separately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple, transparent pricing"
          description="Every price separates the Michigan-limited statutory notarial fee from other lawful service charges."
        />
        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <PricingCard key={plan.key} plan={plan} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/pricing" className="text-sm font-semibold text-accent-600 hover:text-accent-700">
            Full pricing details & comparison →
          </Link>
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-accent-600 py-16">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">Ready to get your document notarized?</h2>
          <p className="text-accent-100">Most appointments are booked and confirmed in under two minutes.</p>
          <LinkButton href="/book" variant="dark" size="lg" className="bg-white text-accent-700 hover:bg-navy-50">
            Book an Appointment <ArrowRight className="h-4 w-4" />
          </LinkButton>
        </div>
      </section>
    </>
  );
}
