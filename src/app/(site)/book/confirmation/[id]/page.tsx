import { notFound } from "next/navigation";
import { CheckCircle2, MapPin, Video } from "lucide-react";
import { prisma } from "@/lib/db";
import { LinkButton } from "@/components/ui/button";
import { PayButton } from "@/components/site/pay-button";
import { createAppointmentCheckoutSession } from "@/lib/actions/payments";
import { formatCents } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Booking Confirmation", robots: { index: false, follow: false } };

export default async function BookingConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { id } = await params;
  const { paid } = await searchParams;
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) notFound();

  const balanceDue = appointment.totalAmountCents - appointment.amountPaidCents;
  const isPaid = appointment.paymentStatus === "paid";

  return (
    <div className="mx-auto max-w-lg px-4 py-20 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-navy-100 bg-white p-10 text-center shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-100 text-success-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-navy-900">You&apos;re booked!</h1>
        {paid === "1" && !isPaid && (
          <p className="mt-2 text-sm text-navy-500">Your payment is processing — this page will update to &ldquo;Paid&rdquo; within a few seconds.</p>
        )}

        <div className="mt-6 rounded-xl bg-navy-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">Confirmation Number</p>
          <p className="mt-1 text-xl font-bold tracking-wide text-navy-900">{appointment.confirmationNumber}</p>
        </div>

        <div className="mt-5 space-y-1.5 text-left text-sm text-navy-600">
          <p className="flex items-center gap-2">
            {appointment.type === "remote" ? <Video className="h-4 w-4 text-navy-400" /> : <MapPin className="h-4 w-4 text-navy-400" />}
            <strong>{appointment.serviceType}</strong> — {appointment.type === "remote" ? "Remote/Online" : "In-Person"}
          </p>
          <p>{formatDateTime(appointment.scheduledStart)}</p>
          <p>Total: <strong>{formatCents(appointment.totalAmountCents, { showCents: false })}</strong></p>
          <p>Payment status: <strong className="capitalize">{appointment.paymentStatus.replace("_", " ")}</strong></p>
        </div>

        {!isPaid && balanceDue > 0 && (
          <div className="mt-6">
            <PayButton action={createAppointmentCheckoutSession} targetId={appointment.id} label={`Pay ${formatCents(balanceDue, { showCents: false })} Now`} />
            <p className="mt-2 text-xs text-navy-400">Or pay in person at your appointment — whichever is easier.</p>
          </div>
        )}

        <p className="mt-6 text-xs text-navy-400">
          Notar-E Services is not a law firm and does not provide legal advice. Please bring valid,
          government-issued photo ID to your appointment.
        </p>
        <LinkButton href="/" variant="outline" className="mt-6 w-full">Return Home</LinkButton>
      </div>
    </div>
  );
}
