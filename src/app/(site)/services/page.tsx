import type { Metadata } from "next";
import {
  FileSignature,
  Home as HomeIcon,
  ClipboardCheck,
  Stamp,
  Scale,
  Building2,
  Car,
  Landmark,
  ScrollText,
  FileQuestion,
  ArrowRight,
  Info,
  Video,
} from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { SiteMotion } from "@/components/site/motion";
import { SectionHeading } from "@/components/site/section-heading";
import { ComplianceNote } from "@/components/site/compliance-note";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Mobile & Online Notary Services in Michigan",
  description:
    "Mobile notary and remote online notarization (eligible documents) in Michigan: real estate, affidavits, acknowledgments, jurats, power of attorney, business, vehicle, financial and estate documents.",
  alternates: { canonical: "/services" },
};

const CATEGORIES = [
  { icon: Stamp, title: "General Notary", desc: "Everyday personal & business documents" },
  { icon: HomeIcon, title: "Real Estate", desc: "Closings, deeds, mortgage & title" },
  { icon: FileSignature, title: "Affidavits", desc: "Sworn written statements" },
  { icon: ClipboardCheck, title: "Acknowledgments", desc: "Identity & voluntary signature" },
  { icon: ScrollText, title: "Jurats", desc: "Oath or affirmation included" },
  { icon: Scale, title: "Power of Attorney", desc: "Financial, medical & general" },
  { icon: Building2, title: "Business", desc: "Resolutions, contracts, agreements" },
  { icon: Car, title: "Vehicle", desc: "Titles, bills of sale, dealer forms" },
  { icon: Landmark, title: "Financial", desc: "Loan & bank documents" },
  { icon: FileQuestion, title: "Estate", desc: "Wills, trusts & estate paperwork" },
];

export default function ServicesPage() {
  return (
    <SiteMotion>
      <PageHero eyebrow="Services" title="Notary services for" accent="everyday documents." subtitle="Mobile, or online for eligible documents.">
        <LinkButton href="/book?type=in_person" size="lg" className="w-full shadow-lg shadow-accent-500/30 sm:w-auto">
          Book a Notary <ArrowRight className="h-4 w-4" />
        </LinkButton>
        <LinkButton href="/book?type=remote" variant="outline" size="lg" className="w-full border-white/20 text-white hover:bg-white/10 sm:w-auto">
          <Video className="h-4 w-4" /> Notarize Online
        </LinkButton>
      </PageHero>

      <section className="relative z-10 -mt-10 px-4 sm:px-6 lg:px-8">
        <div data-stagger className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-2xl border border-white/70 bg-white/95 p-5 shadow-[0_30px_80px_-40px_rgba(10,17,40,0.45)] backdrop-blur-xl">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-navy-900 text-white"><Car className="h-5 w-5" /></span>
            <div>
              <p className="font-bold text-navy-900">Mobile Notary</p>
              <p className="text-sm text-navy-500">We come to you.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-white/70 bg-white/95 p-5 shadow-[0_30px_80px_-40px_rgba(10,17,40,0.45)] backdrop-blur-xl">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-500 text-white"><Video className="h-5 w-5" /></span>
            <div>
              <p className="font-bold text-navy-900">Remote Online Notarization</p>
              <p className="text-sm text-navy-500">Eligible documents &amp; transactions.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div data-reveal>
          <SectionHeading eyebrow="What we notarize" title="Documents we handle" />
        </div>
        <div data-stagger className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {CATEGORIES.map((c) => (
            <div
              key={c.title}
              data-spotlight
              className="spotlight group relative overflow-hidden rounded-2xl border border-navy-100 bg-white p-5 transition-shadow duration-500 hover:shadow-[0_30px_60px_-30px_rgba(35,84,235,0.45)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-100 text-accent-600 transition-[transform,background-color,color] duration-500 group-hover:-rotate-6 group-hover:bg-accent-500 group-hover:text-white">
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-bold text-navy-900">{c.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-navy-500 sm:text-sm">{c.desc}</p>
            </div>
          ))}
        </div>
        <p data-reveal className="mt-6 text-center text-sm text-navy-500">
          Something else? Tell us when you book — we&apos;ll confirm it&apos;s eligible.
        </p>

        <div data-reveal className="mx-auto mt-14 max-w-3xl rounded-2xl border border-warning-100 bg-warning-100/40 p-5">
          <p className="flex items-start gap-3 text-sm leading-relaxed text-navy-700">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning-600" />
            <span>
              <strong className="text-navy-900">No legal advice.</strong> Notar-E Services is not a law firm. We can&apos;t tell you which
              notarial act or document you need, or explain what a document means. Ask an attorney or the requesting party.
            </span>
          </p>
        </div>
        <ComplianceNote className="mx-auto mt-4 max-w-3xl" />
      </section>
    </SiteMotion>
  );
}
