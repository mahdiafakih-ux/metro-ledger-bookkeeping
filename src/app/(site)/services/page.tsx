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
  MapPin,
  Monitor,
} from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { ComplianceNote } from "@/components/site/compliance-note";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Notary Services in Michigan",
  description:
    "General notary, real estate, affidavits, acknowledgments, jurats, power of attorney, business, vehicle, financial, and estate document notarization across Michigan.",
};

const CATEGORIES = [
  {
    icon: Stamp,
    title: "General Notary",
    desc: "Standard notarizations for everyday personal and business documents.",
  },
  {
    icon: HomeIcon,
    title: "Real Estate Documents",
    desc: "Closing packages, deeds, mortgage documents, and title paperwork for agents, buyers, and sellers.",
  },
  {
    icon: FileSignature,
    title: "Affidavits",
    desc: "Sworn written statements notarized quickly and correctly.",
  },
  {
    icon: ClipboardCheck,
    title: "Acknowledgments",
    desc: "Confirming a signer's identity and voluntary signature on a document.",
  },
  {
    icon: ScrollText,
    title: "Jurats",
    desc: "Notarizations that include an oath or affirmation from the signer.",
  },
  {
    icon: Scale,
    title: "Power of Attorney",
    desc: "Financial, medical, and general power of attorney documents.",
  },
  {
    icon: Building2,
    title: "Business Documents",
    desc: "Corporate resolutions, contracts, partnership agreements, and more.",
  },
  {
    icon: Car,
    title: "Vehicle Documents",
    desc: "Title transfers, bills of sale, and dealership paperwork.",
  },
  {
    icon: Landmark,
    title: "Financial Documents",
    desc: "Loan documents, bank forms, and financial institution paperwork.",
  },
  {
    icon: FileQuestion,
    title: "Estate Documents",
    desc: "Wills, trusts, and estate-related paperwork requiring notarization.",
  },
];

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Services"
        title="Notary services for every document"
        description="From a single acknowledgment to a full real estate closing, Notar-E Services handles the notarial act quickly and professionally."
      />

      {/* Mobile & Online Notarization intro */}
      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col rounded-2xl border border-navy-100 bg-white p-7 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-100 text-accent-600">
            <MapPin className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-navy-900">Mobile Notary</h3>
          <p className="mt-2 text-sm leading-relaxed text-navy-500">
            Professional notary services at your location. We come to your home, office, or any
            convenient spot in Metro Detroit and Southeast Michigan.
          </p>
          <div className="mt-6">
            <LinkButton href="/book" size="md" className="w-fit">
              Book Mobile <ArrowRight className="h-4 w-4" />
            </LinkButton>
          </div>
        </div>
        <div className="flex flex-col rounded-2xl border border-navy-100 bg-white p-7 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-100 text-accent-600">
            <Monitor className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-navy-900">Remote Online Notarization</h3>
          <p className="mt-2 text-sm leading-relaxed text-navy-500">
            Eligible documents and transactions can be notarized completely online — secure, fast,
            and legally valid where permitted.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-navy-400 border-t border-navy-100 pt-3">
            Remote online notarization is available for eligible documents and transactions only.
            Not all documents qualify. We&apos;ll confirm eligibility when you book.
          </p>
          <div className="mt-6">
            <LinkButton href="/book" size="md" className="w-fit">
              Start Online <ArrowRight className="h-4 w-4" />
            </LinkButton>
          </div>
        </div>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => (
          <div key={c.title} className="rounded-2xl border border-navy-100 p-6 transition-shadow hover:shadow-lg">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-100 text-accent-600">
              <c.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-bold text-navy-900">{c.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-navy-500">{c.desc}</p>
          </div>
        ))}
        <div className="flex flex-col justify-center rounded-2xl bg-navy-900 p-6 text-white">
          <h3 className="font-bold">Other eligible documents</h3>
          <p className="mt-2 text-sm leading-relaxed text-navy-200">
            Not sure which category your document falls under? Tell us about it when you book and
            we&apos;ll confirm eligibility before your appointment.
          </p>
          <LinkButton href="/book" size="md" className="mt-4 w-fit">
            Book Now <ArrowRight className="h-4 w-4" />
          </LinkButton>
        </div>
      </div>

      <div className="mt-16 rounded-2xl border border-warning-100 bg-warning-100/40 p-6">
        <h3 className="font-bold text-navy-900">Important: We cannot provide legal advice</h3>
        <p className="mt-2 text-sm leading-relaxed text-navy-600">
          Notar-E Services is not a law firm and our notaries are not attorneys. We cannot advise you
          on which notarial act you need, whether your document is legally sufficient, or how to fill
          it out. If you&apos;re unsure, please consult an attorney or the agency requesting your
          document before your appointment.
        </p>
      </div>

      <ComplianceNote className="mt-8" />
    </div>
  );
}
