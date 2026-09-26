import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { SiteMotion } from "@/components/site/motion";
import { FaqAccordion } from "@/components/site/faq-accordion";
import { ComplianceNote } from "@/components/site/compliance-note";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about mobile notary appointments, remote online notarization, Business10/Business30 plans, and Michigan notary fees.",
  alternates: { canonical: "/faq" },
};

const FAQS = [
  { q: "What ID do I need?", a: "A current, government-issued photo ID (driver's license, state ID, passport or military ID). The name should match your document." },
  { q: "How long does it take?", a: "About 20 minutes for most appointments." },
  { q: "Do you come to me?", a: "Yes. We travel to your home, office, or another location in our service area. Any travel fee is agreed before we travel." },
  { q: "Can I notarize online?", a: "Yes, for eligible documents and transactions. Sessions run on BlueNotary, a third-party remote online notarization platform. We confirm eligibility before your session." },
  { q: "What can you notarize?", a: "Most personal and business documents: real estate, affidavits, powers of attorney, vehicle, financial and estate paperwork. See Services." },
  { q: "Can you explain my document?", a: "No. We're not a law firm and can't give legal advice, explain a document, or choose the notarial act for you. Please ask an attorney or the requesting party." },
  { q: "Do you work with businesses?", a: "Yes — title, lending, legal, real estate, property management, dealerships, banks, healthcare and more." },
  { q: "What are Business10 and Business30?", a: "Monthly plans. Business10 is $1,000/month with 10 notarizations included; Business30 is $3,000/month with 30 included. Each additional notarization is $75 on either plan." },
  { q: "Can we switch plans?", a: "Yes. Owners and admins can move between Business10 and Business30 in the client portal. The change applies immediately and Stripe prorates the monthly charge. Notarizations already used that month keep the terms they were used under." },
  { q: "How does business billing work?", a: "One monthly subscription charge, plus one invoice for any notarizations beyond your plan. Usage is visible in your client portal." },
  { q: "What is the statutory notarial fee?", a: "Michigan caps the fee for the notarial act itself at $10 per act (MCL 55.285). Anything above that pays for separate, disclosed services like travel, scheduling or administration." },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

export default function FaqPage() {
  return (
    <SiteMotion>
      <PageHero eyebrow="FAQ" title="Quick" accent="answers." />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div data-reveal>
          <FaqAccordion items={FAQS} />
        </div>
        <ComplianceNote className="mt-10" />
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </SiteMotion>
  );
}
