import { prisma } from "@/lib/db";
import { InvoiceForm } from "@/components/admin/invoice-form";

export default async function NewInvoicePage() {
  const [clients, businesses] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, company: true, email: true } }),
    prisma.business.findMany({ orderBy: { companyName: "asc" }, select: { id: true, companyName: true, contactName: true, email: true } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">New Invoice</h1>
        <p className="mt-1 text-sm text-navy-400">Itemize statutory fees separately from other lawful service charges.</p>
      </div>
      <div className="rounded-2xl border border-navy-100 bg-white p-6 sm:p-8">
        <InvoiceForm clients={clients} businesses={businesses} />
      </div>
    </div>
  );
}
