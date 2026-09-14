import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { NotareLogo } from "@/components/brand/logo";
import { Badge, STATUS_TONES } from "@/components/ui/badge";
import { InvoiceActions } from "@/components/admin/invoice-actions";
import { getBusinessSettings } from "@/lib/settings";
import { formatCents } from "@/lib/money";
import { formatDate, titleCase } from "@/lib/utils";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [invoice, settings] = await Promise.all([
    prisma.invoice.findUnique({ where: { id }, include: { items: true } }),
    getBusinessSettings(),
  ]);
  if (!invoice) notFound();

  const statutoryItems = invoice.items.filter((i) => i.type === "statutory_fee");
  const otherItems = invoice.items.filter((i) => i.type !== "statutory_fee");
  const subtotal = invoice.items.reduce((sum, i) => sum + i.amountCents, 0);
  const total = subtotal + invoice.taxCents;
  const balanceDueCents = total - invoice.amountPaidCents;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy-900">Invoice {invoice.invoiceNumber}</h1>
        <InvoiceActions id={invoice.id} status={invoice.status} balanceDueCents={balanceDueCents} hasEmail={!!invoice.email} />
      </div>
      {invoice.stripePaymentLinkUrl && balanceDueCents > 0 && (
        <p className="no-print text-sm text-navy-500">
          Public payment page: <a href={`/invoice/${invoice.id}`} target="_blank" className="font-medium text-accent-600 hover:underline">notareservices.com/invoice/{invoice.id}</a>
        </p>
      )}

      <div className="rounded-2xl border border-navy-100 bg-white p-8 sm:p-10 print:border-0 print:p-0 print:shadow-none">
        <div className="flex items-start justify-between">
          <NotareLogo size="lg" />
          <div className="text-right">
            <p className="text-2xl font-extrabold text-navy-900">INVOICE</p>
            <p className="text-sm text-navy-500">#{invoice.invoiceNumber}</p>
            <div className="mt-2"><Badge tone={STATUS_TONES[invoice.status] ?? "neutral"}>{titleCase(invoice.status)}</Badge></div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-navy-400">Bill To</p>
            <p className="mt-2 font-semibold text-navy-900">{invoice.clientName}</p>
            {invoice.company && <p className="text-sm text-navy-500">{invoice.company}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wide text-navy-400">From</p>
            <p className="mt-2 font-semibold text-navy-900">{settings.businessName}</p>
            <p className="text-sm text-navy-500">{settings.email}</p>
            <p className="text-sm text-navy-500">{settings.phone}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-8 rounded-xl bg-navy-50 p-4 text-sm print:bg-transparent">
          <div><span className="text-navy-400">Issue Date:</span> <span className="font-medium text-navy-800">{formatDate(invoice.issueDate)}</span></div>
          <div className="text-right"><span className="text-navy-400">Due Date:</span> <span className="font-medium text-navy-800">{formatDate(invoice.dueDate)}</span></div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-navy-200 text-left text-xs font-bold uppercase tracking-wide text-navy-400">
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Unit</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {statutoryItems.length > 0 && (
              <tr><td colSpan={4} className="pt-4 pb-1 text-xs font-bold uppercase tracking-wide text-navy-400">Statutory Notarial Fees (MCL 55.287 — max $10/act)</td></tr>
            )}
            {statutoryItems.map((item: any) => (
              <tr key={item.id} className="border-b border-navy-50">
                <td className="py-2.5 text-navy-700">{item.description}</td>
                <td className="py-2.5 text-right text-navy-600">{item.quantity}</td>
                <td className="py-2.5 text-right text-navy-600">{formatCents(item.unitAmountCents)}</td>
                <td className="py-2.5 text-right font-medium text-navy-900">{formatCents(item.amountCents)}</td>
              </tr>
            ))}
            {otherItems.length > 0 && (
              <tr><td colSpan={4} className="pt-4 pb-1 text-xs font-bold uppercase tracking-wide text-navy-400">Other Lawful Services</td></tr>
            )}
            {otherItems.map((item: any) => (
              <tr key={item.id} className="border-b border-navy-50">
                <td className="py-2.5 text-navy-700">{item.description}</td>
                <td className="py-2.5 text-right text-navy-600">{item.quantity}</td>
                <td className="py-2.5 text-right text-navy-600">{formatCents(item.unitAmountCents)}</td>
                <td className="py-2.5 text-right font-medium text-navy-900">{formatCents(item.amountCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="w-64 space-y-1.5">
            <div className="flex justify-between text-sm"><span className="text-navy-500">Subtotal</span><span className="font-medium text-navy-800">{formatCents(subtotal)}</span></div>
            {invoice.taxCents > 0 && <div className="flex justify-between text-sm"><span className="text-navy-500">Tax</span><span className="font-medium text-navy-800">{formatCents(invoice.taxCents)}</span></div>}
            <div className="flex justify-between border-t border-navy-200 pt-1.5 text-base font-bold"><span className="text-navy-900">Total</span><span className="text-navy-900">{formatCents(total)}</span></div>
            {invoice.amountPaidCents > 0 && <div className="flex justify-between text-sm"><span className="text-navy-500">Paid</span><span className="font-medium text-success-600">−{formatCents(invoice.amountPaidCents)}</span></div>}
            <div className="flex justify-between text-base font-bold"><span className="text-navy-900">Balance Due</span><span className={balanceDueCents > 0 ? "text-danger-600" : "text-success-600"}>{formatCents(Math.max(0, balanceDueCents))}</span></div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-8 rounded-lg bg-navy-50 p-4 text-sm text-navy-600 print:bg-transparent print:border print:border-navy-200">
            <p className="text-xs font-bold uppercase tracking-wide text-navy-400">Notes</p>
            <p className="mt-1">{invoice.notes}</p>
          </div>
        )}

        <p className="mt-10 text-[11px] leading-relaxed text-navy-400">
          Notar-E Services is not a law firm and does not provide legal advice. Statutory notarial fees
          are limited to $10 per notarial act under Michigan law. Other charges reflect separately
          disclosed, lawful business services.
        </p>
      </div>
    </div>
  );
}
