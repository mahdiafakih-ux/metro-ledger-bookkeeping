import { prisma } from "@/lib/db";
import { AppointmentForm } from "@/components/admin/appointment-form";

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const [clients, businesses] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, company: true, email: true, phone: true } }),
    prisma.business.findMany({ orderBy: { companyName: "asc" }, select: { id: true, companyName: true, contactName: true, email: true, phone: true } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">New Appointment</h1>
        <p className="mt-1 text-sm text-navy-400">Schedule a new notary appointment.</p>
      </div>
      <div className="rounded-2xl border border-navy-100 bg-white p-6 sm:p-8">
        <AppointmentForm clients={clients} businesses={businesses} initial={date ? { scheduledStart: `${date}T09:00` } : undefined} />
      </div>
    </div>
  );
}
