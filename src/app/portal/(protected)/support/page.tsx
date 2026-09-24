import { ArrowRight, Clock, Mail, MessageSquareText, Phone, ShieldAlert } from "lucide-react";
import { getBusinessSettings } from "@/lib/settings";
import { getPortalAccount } from "@/lib/portal/account";
import { LEGAL_DISCLAIMER, PREFERENCE_DISCLAIMER } from "@/lib/portal/constants";
import { telHref } from "@/lib/utils";
import { PageHeader, Panel } from "@/components/portal/ui";

export const metadata = { title: "Support" };

// Only describes what the portal actually supports today.
const FAQS: { q: string; a: string }[] = [
  {
    q: "How do I reschedule or cancel an appointment?",
    a: "Call or email Notar-E with your confirmation number (shown on every appointment) and we'll take care of it. Online rescheduling isn't available yet.",
  },
  {
    q: "Can I request the same notary again?",
    a: `Yes. Open a completed appointment and choose "Request again", or add the notary to your preferred list. ${PREFERENCE_DISCLAIMER}`,
  },
  {
    q: "What should I bring to my appointment?",
    a: "Valid, unexpired government-issued photo ID for every signer, and your unsigned documents. Don't sign in advance — you'll sign in front of the notary.",
  },
  {
    q: "How are fees shown?",
    a: "Michigan statutory notarial fees are always itemized separately from any other service charges such as travel or signing-agent services.",
  },
  {
    q: "How do I pay an invoice?",
    a: "Go to Invoices and choose View & pay to pay securely by card. You can also download a PDF copy of any invoice.",
  },
  {
    q: "How do I update my payment method or subscription?",
    a: "Account owners and admins can open the secure Stripe billing portal from the Billing page.",
  },
  {
    q: "Can you tell me which notarial act or document I need?",
    a: LEGAL_DISCLAIMER,
  },
];

export default async function SupportPage() {
  const [settings, account] = await Promise.all([getBusinessSettings(), getPortalAccount()]);
  const subject = encodeURIComponent(`Portal support — ${account.displayName}`);

  return (
    <div className="portal-enter space-y-6">
      <PageHeader title="Support" description="Real people, fast answers. Here's how to reach Notar-E." />

      <div className="grid gap-4 md:grid-cols-3">
        <a href={telHref(settings.phone)} className="portal-lift group rounded-xl border border-navy-100 bg-white p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-100 text-accent-700"><Phone className="h-5 w-5" aria-hidden /></span>
          <p className="mt-4 text-sm font-semibold text-navy-950">Call us</p>
          <p className="tabular mt-0.5 text-[15px] font-semibold text-accent-700">{settings.phone}</p>
          <p className="mt-2 text-[13px] text-navy-500">Best for same-day or urgent requests.</p>
        </a>
        <a href={`mailto:${settings.email}?subject=${subject}`} className="portal-lift group rounded-xl border border-navy-100 bg-white p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-100 text-accent-700"><Mail className="h-5 w-5" aria-hidden /></span>
          <p className="mt-4 text-sm font-semibold text-navy-950">Email support</p>
          <p className="mt-0.5 truncate text-[15px] font-semibold text-accent-700">{settings.email}</p>
          <p className="mt-2 text-[13px] text-navy-500">Include your confirmation or invoice number.</p>
        </a>
        <a href="/contact" className="portal-lift group rounded-xl border border-navy-100 bg-white p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-100 text-accent-700"><MessageSquareText className="h-5 w-5" aria-hidden /></span>
          <p className="mt-4 text-sm font-semibold text-navy-950">Contact form</p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-[15px] font-semibold text-accent-700">
            Send a message <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </p>
          <p className="mt-2 text-[13px] text-navy-500">For general questions and new services.</p>
        </a>
      </div>

      <p className="flex items-center gap-2 text-[13px] text-navy-500">
        <Clock className="h-4 w-4 text-navy-400" aria-hidden /> Serving {settings.serviceArea}.
      </p>

      <Panel>
        <h2 className="border-b border-navy-100 px-5 py-4 text-[15px] font-semibold text-navy-950">Frequently asked questions</h2>
        <div className="divide-y divide-navy-100">
          {FAQS.map((f) => (
            <details key={f.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-navy-900">
                {f.q}
                <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-500 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-navy-600">{f.a}</p>
            </details>
          ))}
        </div>
      </Panel>

      <p className="flex items-start gap-2 text-xs text-navy-400">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> {LEGAL_DISCLAIMER}
      </p>
    </div>
  );
}
