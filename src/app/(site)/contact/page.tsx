import type { Metadata } from "next";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { ContactForm } from "@/components/site/contact-form";
import { getBusinessSettings } from "@/lib/settings";

// Reads admin-editable business settings from the database on every request
// rather than baking them into the build — also keeps this off Next's
// static prerender pass, which would otherwise run at build time (before a
// database may even be reachable, e.g. a fresh Vercel deploy).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact Notar-E Services for mobile notary, remote online notarization, or Business10/Business30 plans in Michigan.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const settings = await getBusinessSettings();

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent-600">Contact</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-navy-900 sm:text-5xl">Let&apos;s <span className="text-gradient-dark">talk.</span></h1>
          <p className="mt-4 text-navy-500">One document or a monthly plan — we&apos;ll reply same business day.</p>

          <div className="mt-10 space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-600"><Phone className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-semibold text-navy-900">Phone</p>
                <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`} className="text-sm text-navy-500 hover:text-accent-600">{settings.phone}</a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-600"><Mail className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-semibold text-navy-900">Email</p>
                <a href={`mailto:${settings.email}`} className="break-all text-sm text-navy-500 hover:text-accent-600">{settings.email}</a>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-600"><MapPin className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-semibold text-navy-900">Service Area</p>
                <p className="text-sm text-navy-500">{settings.serviceArea}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-600"><Clock className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-semibold text-navy-900">Typical Response Time</p>
                <p className="text-sm text-navy-500">Same business day</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="rounded-3xl border border-navy-100 bg-white p-6 shadow-[0_30px_80px_-40px_rgba(10,17,40,0.35)] sm:p-8">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
