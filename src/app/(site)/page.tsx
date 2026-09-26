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
  MapPin,
  Monitor,
  Lock,
  BookOpen,
} from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { SectionHeading } from "@/components/site/section-heading";
import { AnimateOnScroll } from "@/components/site/animate-on-scroll";
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
    { icon: ShieldCheck, label: "Michigan Commissioned" },
    { icon: Lock, label: "Bonded & Insured" },
    { icon: CalendarClock, label: "~20 Min Appointments" },
    { icon: BookOpen, label: "Book Online Instantly" },
    { icon: Zap, label: "Confidential & Secure" },
  ];

  const serviceCategories = [
    { icon: HomeIcon, label: "Real Estate Documents" },
    { icon: Scale, label: "Power of Attorney" },
    { icon: Landmark, label: "Financial Documents" },
    { icon: Car, label: "Vehicle Documents" },
    { icon: FileSignature, label: "Affidavits & Jurats" },
    { icon: Building2, label: "Business Documents" },
  ];

  // Filter business plans: monthly, active, not unlimited
  const businessPlans = plans.filter(
    (p) => p.billingPeriod === "monthly" && p.isActive && p.key !== "unlimited"
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Section 1: Hero ── */}
      <section className="relative overflow-hidden bg-navy-950">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(59,107,255,0.35), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 sm:py-36 lg:px-8">
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

            {/* Service type badge pills */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white">
                <MapPin className="h-3.5 w-3.5 text-accent-300" />
                Mobile Notary
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white">
                <Monitor className="h-3.5 w-3.5 text-accent-300" />
                Remote Online Notarization
              </span>
            </div>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <LinkButton href="/book" size="lg" className="w-full sm:w-auto">
                Book a Mobile Notary <ArrowRight className="h-4 w-4" />
              </LinkButton>
              <LinkButton
                href="/book"
                variant="outline"
                size="lg"
                className="w-full border-white/25 text-white hover:bg-white/10 sm:w-auto"
              >
                Notarize Online
              </LinkButton>
            </div>

            {/* Trust row */}
            <p className="mt-6 text-xs text-navy-400">
              Michigan Commissioned&nbsp;·&nbsp;Bonded &amp; Insured&nbsp;·&nbsp;~20 Min Appointments
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 2: Trust bar ── */}
      <AnimateOnScroll>
        <section className="border-b border-navy-100 bg-white">
          <div className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-max items-center justify-center gap-8 py-6 md:min-w-0 md:grid md:grid-cols-5">
              {trustItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-navy-600">
                  <item.icon className="h-4 w-4 shrink-0 text-accent-500" />
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimateOnScroll>

      {/* ── Section 3: Two Service Types ── */}
      <AnimateOnScroll>
        <section className="bg-navy-50 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading title="Two ways to get notarized" eyebrow="Our Services" />
            <div className="mt-14 grid gap-8 md:grid-cols-2">
              {/* Card A: Mobile Notary */}
              <div className="flex flex-col rounded-2xl border border-navy-100 bg-white p-8 shadow-sm">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-100">
                  <MapPin className="h-7 w-7 text-accent-600" />
                </div>
                <h3 className="text-xl font-bold text-navy-900">Mobile Notary</h3>
                <p className="mt-3 flex-1 text-base leading-relaxed text-navy-500">
                  We come to you — at your home, office, or any convenient location in Metro Detroit
                  and Southeast Michigan.
                </p>
                <Link
                  href="/book"
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-600 hover:text-accent-700"
                >
                  Book a Mobile Notary <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Card B: Remote Online Notarization */}
              <div className="flex flex-col rounded-2xl border border-navy-100 bg-white p-8 shadow-sm">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-100">
                  <Monitor className="h-7 w-7 text-accent-600" />
                </div>
                <h3 className="text-xl font-bold text-navy-900">Remote Online Notarization</h3>
                <p className="mt-3 flex-1 text-base leading-relaxed text-navy-500">
                  Eligible documents can be notarized entirely online — no travel required.
                </p>
                <p className="mt-3 text-xs text-navy-400">
                  Remote online notarization is available for eligible documents and transactions.
                </p>
                <Link
                  href="/book"
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-600 hover:text-accent-700"
                >
                  Start Online <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </AnimateOnScroll>

      {/* ── Section 4: How It Works ── */}
      <AnimateOnScroll>
        <section className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="How It Works"
              title="Three steps to a notarized document"
              description="No phone tag, no waiting rooms — just a fast, professional appointment when you need it."
            />
            <div className="relative mt-14">
              {/* Connecting line — desktop only */}
              <div
                className="absolute left-0 right-0 top-9 hidden h-px md:block"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, #c8d7ff 20%, #3b6bff 50%, #c8d7ff 80%, transparent 100%)",
                }}
                aria-hidden="true"
              />
              <div className="relative grid gap-8 md:grid-cols-3">
                {[
                  {
                    step: "01",
                    title: "Book Online",
                    desc: "Choose in-person or remote, pick a time that works, and enter your document details in under two minutes.",
                  },
                  {
                    step: "02",
                    title: "Meet Your Notary",
                    desc: "We come to you, meet you at a convenient location, or connect remotely — appointments take about 20 minutes.",
                  },
                  {
                    step: "03",
                    title: "Get Notarized",
                    desc: "Sign, verify ID, and you're done. Receive your confirmation and receipt immediately.",
                  },
                ].map((s) => (
                  <div
                    key={s.step}
                    className="rounded-2xl border border-navy-100 bg-white p-8 shadow-sm"
                  >
                    <span className="text-3xl font-extrabold text-accent-200">{s.step}</span>
                    <h3 className="mt-3 text-lg font-bold text-navy-900">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-navy-500">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </AnimateOnScroll>

      {/* ── Section 5: Document Categories ── */}
      <AnimateOnScroll>
        <section className="bg-navy-50 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="What We Notarize" title="What we notarize" />
            <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {serviceCategories.map((c) => (
                <div
                  key={c.label}
                  className="flex flex-col items-center gap-3 rounded-xl border border-navy-100 bg-white p-6 text-center shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100">
                    <c.icon className="h-5 w-5 text-accent-600" />
                  </div>
                  <p className="text-sm font-semibold text-navy-800">{c.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link
                href="/services"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-600 hover:text-accent-700"
              >
                View All Services <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </AnimateOnScroll>

      {/* ── Section 6: For Businesses ── */}
      <AnimateOnScroll>
        <section className="bg-navy-950 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Business Solutions"
              title="Your on-demand notary partner"
              description="Title companies, law firms, real estate teams, and dealerships trust Notar-E for reliable, professional notarization."
              light
            />
            <div className="mt-14 grid gap-6 md:grid-cols-2">
              {businessPlans.map((plan) => {
                const dollars = Math.floor(plan.totalCents / 100);
                return (
                  <div
                    key={plan.key}
                    className="flex flex-col rounded-2xl border border-navy-800 bg-navy-900 p-8"
                  >
                    <p className="text-sm font-bold uppercase tracking-widest text-accent-400">
                      {plan.name}
                    </p>
                    <p className="mt-3 text-4xl font-extrabold text-white">
                      ${dollars.toLocaleString()}
                      <span className="text-lg font-medium text-navy-300">/mo</span>
                    </p>
                    {plan.appointmentsIncluded != null && (
                      <p className="mt-2 text-sm text-navy-300">
                        {plan.appointmentsIncluded} appointments included
                      </p>
                    )}
                    {plan.overageFeeCents != null && (
                      <p className="mt-1 text-xs text-navy-400">
                        ${Math.floor(plan.overageFeeCents / 100)} per additional appointment
                      </p>
                    )}
                    <div className="mt-6">
                      <LinkButton href="/contact" variant="outline" size="md" className="border-navy-700 text-navy-100 hover:bg-navy-800 hover:text-white">
                        Get Started <ArrowRight className="h-4 w-4" />
                      </LinkButton>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/business-solutions"
                className="text-sm font-semibold text-accent-400 hover:text-accent-300"
              >
                See all business features →
              </Link>
            </div>
          </div>
        </section>
      </AnimateOnScroll>

      {/* ── Section 7: CTA Banner ── */}
      <AnimateOnScroll>
        <section className="bg-accent-600 py-16">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white">
              Ready to get your document notarized?
            </h2>
            <p className="text-accent-100">
              Most appointments booked and confirmed in under two minutes.
            </p>
            <LinkButton
              href="/book"
              variant="dark"
              size="lg"
              className="bg-white text-accent-700 hover:bg-navy-50"
            >
              Book an Appointment <ArrowRight className="h-4 w-4" />
            </LinkButton>
          </div>
        </section>
      </AnimateOnScroll>
    </>
  );
}
