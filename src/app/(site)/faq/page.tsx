import type { Metadata } from "next";
import { SectionHeading } from "@/components/site/section-heading";
import { FaqAccordion } from "@/components/site/faq-accordion";
import { ComplianceNote } from "@/components/site/compliance-note";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Notar-E Services Michigan notary appointments, pricing, and business solutions.",
};

const FAQS = [
  { q: "What identification do I need?", a: "Bring a valid, current, government-issued photo ID such as a driver's license, state ID, passport, or military ID. The name on your ID should match the name on your document." },
  { q: "How long does an appointment take?", a: "Most appointments take about 20 minutes, depending on how many documents and signatures need to be notarized." },
  { q: "Do you travel to me?", a: "Yes — in-person appointments can take place at your home, office, or another convenient location within our Michigan service area. A service fee applies and is disclosed before booking." },
  { q: "Can you notarize online?", a: "Remote/online notarization is available where legally eligible for your specific document type. We'll confirm eligibility during booking." },
  { q: "What documents can you notarize?", a: "We notarize most personal and business documents including real estate paperwork, affidavits, powers of attorney, vehicle titles, financial documents, and more. See our Services page for a full list." },
  { q: "Can you explain my document to me?", a: "No — Notar-E Services is not a law firm and our notaries cannot provide legal advice, explain document contents, or tell you which notarial act you need. Please consult an attorney or the requesting party if you have questions." },
  { q: "Do you work with businesses?", a: "Yes — we work with title companies, mortgage companies, real estate agents, law firms, property managers, dealerships, financial institutions, and more. Visit our Business Solutions page to learn more." },
  { q: "Do you provide recurring services?", a: "Yes — our Business 20 and Business Unlimited plans are built for organizations with regular notary needs, with simple monthly invoicing." },
  { q: "How does business billing work?", a: "Business clients receive one consolidated monthly invoice covering their plan and any additional appointments, rather than paying per visit." },
  { q: "What does the statutory notarial fee mean?", a: "Michigan law caps the fee a notary may charge for the notarial act itself at $10 per act. Any additional amount you pay covers other lawful, separately-disclosed services like travel or administrative handling — never the notarization itself." },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
      <div className="mt-12">
        <FaqAccordion items={FAQS} />
      </div>
      <ComplianceNote className="mt-10" />
    </div>
  );
}
