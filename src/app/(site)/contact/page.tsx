import type { Metadata } from "next";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { ContactForm } from "@/components/site/contact-form";
import { getBusinessSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Notar-E Services for individual or business notary needs across Michigan.",
};

export default async function ContactPage() {
  const settings = await getBusinessSettings();

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent-600">Contact</p>
          <h1 className="text-3xl font-bold text-navy-900 sm:text-4xl">Let&apos;s talk</h1>
          <p className="mt-4 text-navy-500">
            Whether you need a single document notarized or want to set up recurring business
            service, we&apos;d love to hear from you.
          </p>

          <div className="mt-10 space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-600"><Phone className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-semibold text-navy-900">Phone</p>
                <p className="text-sm text-navy-500">{settings.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-600"><Mail className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-semibold text-navy-900">Email</p>
                <p className="text-sm text-navy-500">{settings.email}</p>
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
          <div className="rounded-3xl border border-navy-100 bg-white p-8 shadow-sm">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
