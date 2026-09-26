import type { Metadata } from "next";
import { ArrowRight, Award, ShieldCheck, Users, Video, Zap } from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { LinkButton } from "@/components/ui/button";
import { PageHero } from "@/components/site/page-hero";
import { SiteMotion } from "@/components/site/motion";

export const metadata: Metadata = {
  title: "About Notar-E Services",
  description: "Notar-E Services is a Michigan-commissioned mobile and online notary company built for speed, transparency and convenience.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  { icon: Zap, title: "Fast", desc: "Book in minutes. Done in about 20." },
  { icon: ShieldCheck, title: "Trusted", desc: "Commissioned, bonded & insured." },
  { icon: Video, title: "Flexible", desc: "Mobile or online for eligible documents." },
  { icon: Award, title: "Transparent", desc: "Statutory fees always itemized." },
];

export default function AboutPage() {
  return (
    <SiteMotion>
      <PageHero
        eyebrow="About"
        title="Notarization,"
        accent="reimagined."
        subtitle="No driving across town. No waiting rooms. No phone tag."
      />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div data-reveal>
          <SectionHeading eyebrow="What we stand for" title="Simple. Professional. Convenient." />
        </div>
        <div data-stagger className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-2xl border border-navy-100 bg-white p-6 text-center transition-shadow duration-500 hover:shadow-lg">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-100 text-accent-600">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-bold text-navy-900">{v.title}</h3>
              <p className="mt-1 text-sm text-navy-500">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-navy-50 py-20">
        <div className="mx-auto grid max-w-5xl items-center gap-8 px-4 sm:px-6 md:grid-cols-[1.2fr_1fr] lg:px-8">
          <div data-reveal>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-600">Commissioned &amp; compliant</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy-900">Clear about every dollar.</h2>
            <p className="mt-4 text-navy-500">
              Michigan limits the notarial-act fee to $10 per act (MCL 55.285). We show it separately from every other charge.
              We&apos;re not a law firm and never give legal advice.
            </p>
          </div>
          <div data-reveal className="flex flex-col gap-3 sm:flex-row md:flex-col">
            <LinkButton href="/book" size="lg" className="w-full">
              Book a Notary <ArrowRight className="h-4 w-4" />
            </LinkButton>
            <LinkButton href="/careers" variant="outline" size="lg" className="w-full bg-white">
              <Users className="h-4 w-4" /> Join the Notar-E Network
            </LinkButton>
          </div>
        </div>
      </section>
    </SiteMotion>
  );
}
