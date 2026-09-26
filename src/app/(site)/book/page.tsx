import type { Metadata } from "next";
import { BookingWizard } from "@/components/site/booking-wizard";
import { getBusinessSettings } from "@/lib/settings";
import { prisma } from "@/lib/db";

// Reads admin-editable business settings/pricing/availability from the
// database on every request rather than baking them into the build — also
// keeps this off Next's static prerender pass, which would otherwise run
// at build time (before a database may even be reachable).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book a Notary",
  description: "Book a mobile notary or a remote online notarization in Michigan in under two minutes. Online available for eligible documents.",
  alternates: { canonical: "/book" },
};

export default async function BookPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const initialType = type === "remote" || type === "in_person" ? type : "";
  const settings = await getBusinessSettings();
  const individualPlan = await prisma.pricingPlan.findUnique({ where: { key: "individual" } });

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent-600">Book a Notary</p>
        <h1 className="text-3xl font-bold text-navy-900 sm:text-4xl">Mobile or online. Your call.</h1>
        <p className="mt-3 text-navy-500">Most bookings take under two minutes.</p>
      </div>
      <BookingWizard
        statutoryFeePerActCents={individualPlan?.statutoryFeeCents ?? 1000}
        serviceFeeCents={individualPlan?.serviceFeeCents ?? 11500}
        maxAdvanceDays={settings.maxAdvanceDays}
        initialType={initialType}
      />
    </div>
  );
}
