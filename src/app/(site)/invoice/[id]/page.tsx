import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { NotareLogo } from "@/components/brand/logo";
import { Badge, STATUS_TONES } from "@/components/ui/badge";
import { PayButton } from "@/components/site/pay-button";
import { createInvoiceCheckoutSession } from "@/lib/actions/payments";
import { getBusinessSettings } from "@/lib/settings";
import { formatCents } from "@/lib/money";
import { formatDate, titleCase } from "@/lib/utils";

export const metadata = { title: "Invoice", robots: { index: false, follow: false } };

export default async function PublicInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { id } = await params;
  const { paid } = await searchParams;
  const [invoice, settings] = await Promise.all([
    prisma.invoice.findUnique({ where: { id }, include: { items: true } }),
    getBusinessSettings(),
  ]);
  if (!invoice) notFound();

  const statutoryItems = invoice.items.filter((i) => i.type === "statutory_fee");
  const otherItems = invoice.items.filter((i) => i.type !== "statutory_fee");
  const subtotal = invoice.items.reduce((sum, i) => sum + i.amountCents, 0);
  const total = subtotal + invoice.taxCents;
  const balanceDue = total - invoice.amountPaidCents;
  const isPaid = invoice.status === "paid" || balanceDue <= 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      {paid === "1" && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-success-100 bg-success-100/40 p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-success-600" />
          <p className="text-sm text-navy-700">
            Thank you! Your payment is processing — this page will show as paid within a few seconds
            once confirmed.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-navy-100 bg-white p-8 sm:p-10">
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

        <div className="mt-8 grid grid-cols-2 gap-8 rounded-xl bg-navy-50 p-4 text-sm">
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
            {statutoryItems.map((item) => (
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
            {otherItems.map((item) => (
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
            <div className="flex justify-between text-base font-bold"><span className="text-navy-900">Balance Due</span><span className={balanceDue > 0 ? "text-danger-600" : "text-success-600"}>{formatCents(Math.max(0, balanceDue))}</span></div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-8 rounded-lg bg-navy-50 p-4 text-sm text-navy-600">
            <p className="text-xs font-bold uppercase tracking-wide text-navy-400">Notes</p>
            <p className="mt-1">{invoice.notes}</p>
          </div>
        )}

        {!isPaid && (
          <div className="mt-8">
            <PayButton action={createInvoiceCheckoutSession} targetId={invoice.id} label={`Pay ${formatCents(balanceDue)} Now`} />
          </div>
        )}
        {isPaid && (
          <div className="mt-8 flex items-center gap-2 rounded-xl bg-success-100/40 p-4 text-sm font-medium text-success-700">
            <CheckCircle2 className="h-4 w-4" /> This invoice has been paid in full. Thank you!
          </div>
        )}

        <p className="mt-10 text-[11px] leading-relaxed text-navy-400">
          Notar-E Services is not a law firm and does not provide legal advice. Statutory notarial
          fees are limited to $10 per notarial act under Michigan law. Other charges reflect
          separately disclosed, lawful business services.
        </p>
      </div>
    </div>
  );
}
