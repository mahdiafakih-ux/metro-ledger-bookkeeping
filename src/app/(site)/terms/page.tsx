import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Notar-E Services terms of service.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-navy-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-navy-400">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

      <div className="mt-10 space-y-8 text-navy-600">
        <section>
          <h2 className="text-lg font-bold text-navy-900">1. Services</h2>
          <p className="mt-2 leading-relaxed">
            Notar-E Services provides notarial acts performed by a Michigan-commissioned notary
            public, along with related, separately-disclosed lawful business services such as travel,
            signing-agent time, document handling, and administrative service.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-navy-900">2. Not Legal Advice</h2>
          <p className="mt-2 leading-relaxed">
            Notar-E Services is not a law firm and does not provide legal advice. Our notaries cannot
            advise you on which notarial act or document you require, review documents for legal
            sufficiency, or explain document contents. Consult a licensed attorney for legal advice.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-navy-900">3. Pricing & Fees</h2>
          <p className="mt-2 leading-relaxed">
            The statutory fee for a notarial act is limited to $10 per act under Michigan law (MCL
            55.287). Any additional charges are for other lawful services and are disclosed to you
            before your appointment is confirmed. Business plan pricing, appointment allowances, and
            overage rates are set forth at time of enrollment and may be updated by Notar-E Services
            with notice.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-navy-900">4. Cancellations & Rescheduling</h2>
          <p className="mt-2 leading-relaxed">
            Appointments may be rescheduled or cancelled by contacting us directly. Repeated no-shows
            may affect future scheduling priority.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-navy-900">5. Client Responsibilities</h2>
          <p className="mt-2 leading-relaxed">
            You are responsible for bringing valid, government-issued photo identification and
            ensuring your document is complete and ready for signature. Notar-E Services may decline
            to notarize a document if legal requirements for notarization are not met.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-navy-900">6. Limitation of Liability</h2>
          <p className="mt-2 leading-relaxed">
            Notar-E Services performs notarial acts in accordance with Michigan law but is not
            responsible for the legal validity, enforceability, or consequences of the underlying
            document.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-navy-900">7. Contact</h2>
          <p className="mt-2 leading-relaxed">
            Questions about these terms? Reach out through our <a href="/contact" className="font-semibold text-accent-600">Contact page</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
