import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Notar-E Services privacy policy.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-navy-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-navy-400">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

      <div className="prose-notare mt-10 space-y-8 text-navy-600">
        <section>
          <h2 className="text-lg font-bold text-navy-900">1. Information We Collect</h2>
          <p className="mt-2 leading-relaxed">
            When you book an appointment, contact us, or use our services, we may collect your name,
            email address, phone number, company name, mailing/service address, document type
            information, and payment status. We do not collect or store the content of the documents
            you have notarized.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-navy-900">2. How We Use Your Information</h2>
          <p className="mt-2 leading-relaxed">
            We use your information to schedule and complete appointments, communicate booking
            confirmations and reminders, process payments and invoices, and improve our services. We
            do not sell your personal information.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-navy-900">3. Information Sharing</h2>
          <p className="mt-2 leading-relaxed">
            We do not share your personal information with third parties except as necessary to
            provide our services (such as payment processing) or as required by law.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-navy-900">4. Data Security</h2>
          <p className="mt-2 leading-relaxed">
            We use reasonable administrative, technical, and physical safeguards to protect your
            information, including encrypted connections and access-controlled systems.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-navy-900">5. Your Rights</h2>
          <p className="mt-2 leading-relaxed">
            You may request access to, correction of, or deletion of your personal information by
            contacting us directly.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold text-navy-900">6. Contact Us</h2>
          <p className="mt-2 leading-relaxed">
            Questions about this policy? Reach out through our <a href="/contact" className="font-semibold text-accent-600">Contact page</a>.
          </p>
        </section>
        <p className="text-xs text-navy-400">
          This page is provided for general informational purposes and does not constitute legal
          advice. Notar-E Services is not a law firm.
        </p>
      </div>
    </div>
  );
}
