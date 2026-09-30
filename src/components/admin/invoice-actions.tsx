"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Printer, Trash2, Link2, RotateCcw, DollarSign, Loader2, Mail, Download } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { updateInvoiceStatus, deleteInvoice, sendInvoiceEmailAction } from "@/lib/actions/invoices";
import { createInvoiceCheckoutSession, refundInvoicePayment, recordManualPayment } from "@/lib/actions/payments";
import { INVOICE_STATUSES } from "@/lib/constants";
import { titleCase } from "@/lib/utils";
import { formatCents } from "@/lib/money";

export function InvoiceActions({ id, status, balanceDueCents, hasEmail }: { id: string; status: string; balanceDueCents: number; hasEmail: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<{ success: boolean; error?: string }>) {
    setLoading(key);
    const res = await fn();
    setLoading(null);
    if (res && res.success === false) toast.error(res.error ?? "Action failed");
    router.refresh();
  }

  const canPay = balanceDueCents > 0 && status !== "cancelled" && status !== "refunded";
  const canRefund = status === "paid" || status === "partially_paid";

  return (
    <div className="no-print flex flex-wrap items-center gap-3">
      <Select
        value={status}
        onChange={async (e) => {
          await updateInvoiceStatus(id, e.target.value);
          toast.success("Status updated");
          router.refresh();
        }}
        className="w-auto"
      >
        {INVOICE_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
      </Select>

      {canPay && (
        <Button
          variant="outline"
          disabled={!!loading}
          onClick={() =>
            run("cash", () => recordManualPayment({ invoiceId: id, amountDollars: balanceDueCents / 100, method: "cash" }))
          }
        >
          {loading === "cash" ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
          Mark Paid — {formatCents(balanceDueCents, { showCents: false })} Cash/Check
        </Button>
      )}
      {canPay && (
        <Button
          variant="outline"
          disabled={!!loading}
          onClick={() =>
            run("link", async () => {
              const res = await createInvoiceCheckoutSession(id);
              if (res.success && res.url) {
                await navigator.clipboard.writeText(res.url).catch(() => {});
                toast.success("Payment link copied to clipboard");
              }
              return res;
            })
          }
        >
          {loading === "link" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          Copy Stripe Payment Link
        </Button>
      )}
      {canRefund && (
        <Button
          variant="outline"
          disabled={!!loading}
          onClick={() => {
            if (!confirm("Refund this invoice's payment? This issues a real Stripe refund if paid by card.")) return;
            run("refund", () => refundInvoicePayment(id));
          }}
        >
          {loading === "refund" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          Refund
        </Button>
      )}
      {hasEmail && (
        <Button
          variant="outline"
          disabled={!!loading}
          onClick={() => run("email", () => sendInvoiceEmailAction(id).then((r) => { if (r.success) toast.success("Invoice emailed"); return r; }))}
        >
          {loading === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          Email Invoice
        </Button>
      )}
      <Button variant="outline" onClick={() => window.print()}>
        <Printer className="h-4 w-4" /> Print
      </Button>
      <LinkButton href={`/api/invoices/${id}/pdf`} variant="outline">
        <Download className="h-4 w-4" /> Download PDF
      </LinkButton>
      <Button
        variant="danger"
        onClick={async () => {
          if (!confirm("Delete this invoice?")) return;
          await deleteInvoice(id);
          toast.success("Invoice deleted");
          router.push("/admin/invoices");
          router.refresh();
        }}
      >
        <Trash2 className="h-4 w-4" /> Delete
      </Button>
    </div>
  );
}
