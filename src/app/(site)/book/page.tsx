import type { Metadata } from "next";
import { BookingWizard } from "@/components/site/booking-wizard";
import { getBusinessSettings } from "@/lib/settings";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Book an Appointment",
  description: "Book a Michigan notary appointment online in minutes — in-person or remote/online where eligible.",
};

export default async function BookPage() {
  const settings = await getBusinessSettings();
  const individualPlan = await prisma.pricingPlan.findUnique({ where: { key: "individual" } });

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent-600">Book an Appointment</p>
        <h1 className="text-3xl font-bold text-navy-900 sm:text-4xl">Let&apos;s get your document notarized</h1>
        <p className="mt-3 text-navy-500">Most bookings take less than two minutes.</p>
      </div>
      <BookingWizard
        statutoryFeePerActCents={individualPlan?.statutoryFeeCents ?? 1000}
        serviceFeeCents={individualPlan?.serviceFeeCents ?? 11500}
        maxAdvanceDays={settings.maxAdvanceDays}
      />
    </div>
  );
}
