import type { Metadata } from "next";
import {
  ArrowRight,
  Briefcase,
  CalendarClock,
  Car,
  Cpu,
  FileSignature,
  HeartHandshake,
  MapPin,
  Rocket,
  Settings2,
  Sparkles,
  Stamp,
  TrendingUp,
  Video,
} from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { SectionHeading } from "@/components/site/section-heading";
import { PageHero } from "@/components/site/page-hero";
import { SiteMotion } from "@/components/site/motion";
import { CareerApplicationForm } from "@/components/site/career-application-form";
import { CAREER_ROLES } from "@/lib/careers";
import { prisma } from "@/lib/db";

// Open positions are managed in /admin/careers and read on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Careers — Join the Notar-E Network",
  description:
    "Join Notar-E Services, a growing Michigan mobile and online notary company. Commissioned notaries, mobile notaries, remote online notaries, signing agents, sales and operations — express interest today.",
  alternates: { canonical: "/careers" },
  openGraph: {
    title: "Careers at Notar-E Services",
    description: "Build the future of notarization with us. Join our network of mobile and online notaries.",
    url: "/careers",
  },
};

const WHY = [
  { icon: Cpu, title: "Technology-first", desc: "Online booking, digital workflows, remote sessions." },
  { icon: CalendarClock, title: "Flexible", desc: "Work that fits around your schedule." },
  { icon: Sparkles, title: "Professional", desc: "A brand clients take seriously." },
  { icon: HeartHandshake, title: "Client-obsessed", desc: "Fast, clear, respectful service." },
  { icon: TrendingUp, title: "Growing", desc: "Individuals and business partners." },
];

const ROLE_ICONS: Record<string, typeof Stamp> = {
  commissioned_notary: Stamp,
  mobile_notary: Car,
  ron_notary: Video,
  signing_agent: FileSignature,
  sales: Rocket,
  operations: Settings2,
};

const VALUES = ["Professionalism", "Reliability", "Communication", "Accuracy", "Customer service", "Technology", "Growth mindset"];

export default async function CareersPage() {
  const openings = await prisma.jobOpening.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: { id: true, title: true, roleKey: true, location: true, employment: true, summary: true },
  });

  return (
    <SiteMotion>
      <PageHero
        eyebrow="Careers"
        title="Build the future of notarization"
        accent="with us."
        subtitle="We're building a network of professionals delivering convenient mobile and online notarization."
      >
        <LinkButton href="#apply" size="lg" className="w-full shadow-lg shadow-accent-500/30 sm:w-auto">
          Join the Notar-E Network <ArrowRight className="h-4 w-4" />
        </LinkButton>
        <LinkButton href="#roles" variant="outline" size="lg" className="w-full border-white/20 text-white hover:bg-white/10 sm:w-auto">
          Explore Roles
        </LinkButton>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div data-reveal>
          <SectionHeading eyebrow="Why Notar-E" title="A modern notary company." />
        </div>
        <div data-stagger className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {WHY.map((w, i) => (
            <div
              key={w.title}
              data-spotlight
              className={`spotlight group relative overflow-hidden rounded-2xl border border-navy-100 bg-white p-5 transition-shadow duration-500 hover:shadow-[0_30px_60px_-30px_rgba(35,84,235,0.45)] ${i === WHY.length - 1 ? "col-span-2 md:col-span-1" : ""}`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-100 text-accent-600 transition-colors duration-300 group-hover:bg-accent-500 group-hover:text-white">
                <w.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-bold text-navy-900">{w.title}</h3>
              <p className="mt-1 text-sm text-navy-500">{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="openings" className="scroll-mt-20 bg-navy-50 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div data-reveal>
            <SectionHeading eyebrow="Open positions" title={openings.length ? "Now hiring" : "No open positions right now"} />
          </div>
          {openings.length > 0 ? (
            <ul data-stagger className="mt-10 space-y-3">
              {openings.map((o) => (
                <li key={o.id} className="flex flex-col gap-4 rounded-2xl border border-white bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div>
                    <p className="text-lg font-bold text-navy-900">{o.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-navy-500">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {o.location}</span>
                      <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {o.employment}</span>
                    </p>
                    {o.summary && <p className="mt-2 max-w-xl text-sm text-navy-600">{o.summary}</p>}
                  </div>
                  <LinkButton href="#apply" size="md" className="w-full shrink-0 sm:w-auto">Apply</LinkButton>
                </li>
              ))}
            </ul>
          ) : (
            <p data-reveal className="mx-auto mt-6 max-w-xl text-center text-navy-500">
              We&apos;re growing our network. Express interest below and we&apos;ll reach out when there&apos;s a fit.
            </p>
          )}
        </div>
      </section>

      <section id="roles" className="scroll-mt-20 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div data-reveal>
          <SectionHeading eyebrow="Join our network" title="Who we're looking for" description="Areas of interest — not a list of open jobs." />
        </div>
        <div data-stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAREER_ROLES.map((r) => {
            const Icon = ROLE_ICONS[r.key] ?? Stamp;
            return (
              <a
                key={r.key}
                href="#apply"
                className="group flex items-center gap-4 rounded-2xl border border-navy-100 bg-white p-5 transition-[box-shadow,transform] duration-500 hover:-translate-y-0.5 hover:shadow-[0_30px_60px_-30px_rgba(35,84,235,0.45)]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy-900 text-white transition-colors duration-300 group-hover:bg-accent-500">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-navy-900">{r.label}</span>
                  <span className="block text-sm text-navy-500">{r.short}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-navy-300 transition-transform group-hover:translate-x-0.5 group-hover:text-accent-600" />
              </a>
            );
          })}
        </div>
      </section>

      <section className="page-hero py-16">
        <div aria-hidden className="hero-grid pointer-events-none absolute inset-0 -z-10 opacity-60" />
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <p data-reveal className="text-xs font-bold uppercase tracking-[0.3em] text-accent-300">What we value</p>
          <ul data-stagger className="mt-6 flex flex-wrap justify-center gap-2.5">
            {VALUES.map((v) => (
              <li key={v} className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                {v}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="apply" className="scroll-mt-20 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div data-reveal>
            <SectionHeading eyebrow="Apply" title="Join the Notar-E Network" description="Takes about three minutes." />
          </div>
          <div className="relative mt-10 rounded-3xl border border-navy-100 bg-white p-5 shadow-[0_30px_80px_-40px_rgba(10,17,40,0.35)] sm:p-8">
            <CareerApplicationForm openings={openings.map((o) => ({ id: o.id, title: o.title }))} />
          </div>
        </div>
      </section>
    </SiteMotion>
  );
}
