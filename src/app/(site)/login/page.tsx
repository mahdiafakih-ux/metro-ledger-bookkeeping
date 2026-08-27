import type { Metadata } from "next";
import { Lock, Mail, Phone } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { getBusinessSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Client Login",
  description: "Notar-E Services client portal.",
};

export default async function ClientLoginPage() {
  const settings = await getBusinessSettings();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900 text-white">
        <Lock className="h-6 w-6" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-navy-900">Client Portal</h1>
      <p className="mt-3 text-navy-500">
        Self-service account access for appointment history and invoices is coming soon. In the
        meantime, our team is happy to help directly.
      </p>
      <div className="mt-8 flex w-full flex-col gap-3">
        <LinkButton href={`mailto:${settings.email}`} size="lg" className="w-full">
          <Mail className="h-4 w-4" /> Email Us
        </LinkButton>
        <LinkButton href={`tel:${settings.phone.replace(/[^0-9+]/g, "")}`} variant="outline" size="lg" className="w-full">
          <Phone className="h-4 w-4" /> Call {settings.phone}
        </LinkButton>
      </div>
      <p className="mt-10 text-xs text-navy-400">
        Notar-E Services team member? <a href="/admin" className="font-semibold text-accent-600">Sign in to the Command Center →</a>
      </p>
    </div>
  );
}
