"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, XCircle, UserX, DollarSign, Trash2, Link2, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setAppointmentStatus, setAppointmentPaymentStatus, deleteAppointment } from "@/lib/actions/appointments";
import { createAppointmentCheckoutSession, refundAppointmentPayment, recordManualPayment } from "@/lib/actions/payments";
import { formatCents } from "@/lib/money";

export function AppointmentActions({
  id,
  status,
  paymentStatus,
  balanceDueCents,
}: {
  id: string;
  status: string;
  paymentStatus: string;
  balanceDueCents: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<{ success: boolean; error?: string }>) {
    setLoading(key);
    const res = await fn();
    setLoading(null);
    if (res && res.success === false) toast.error(res.error ?? "Action failed");
    router.refresh();
  }

  const canPay = paymentStatus !== "paid" && paymentStatus !== "refunded" && balanceDueCents > 0;
  const canRefund = paymentStatus === "paid" || paymentStatus === "partially_paid";

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "completed" && (
        <Button size="sm" variant="subtle" disabled={!!loading} onClick={() => run("completed", () => setAppointmentStatus(id, "completed"))}>
          <CheckCircle2 className="h-4 w-4" /> Mark Completed
        </Button>
      )}
      {status !== "no_show" && (
        <Button size="sm" variant="subtle" disabled={!!loading} onClick={() => run("no_show", () => setAppointmentStatus(id, "no_show"))}>
          <UserX className="h-4 w-4" /> Mark No-Show
        </Button>
      )}
      {status !== "cancelled" && (
        <Button size="sm" variant="subtle" disabled={!!loading} onClick={() => run("cancelled", () => setAppointmentStatus(id, "cancelled"))}>
          <XCircle className="h-4 w-4" /> Cancel
        </Button>
      )}

      {canPay && (
        <Button
          size="sm"
          variant="subtle"
          disabled={!!loading}
          onClick={() =>
            run("cash", () =>
              recordManualPayment({ appointmentId: id, amountDollars: balanceDueCents / 100, method: "cash" })
            )
          }
        >
          {loading === "cash" ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
          Mark Paid — {formatCents(balanceDueCents, { showCents: false })} Cash/Check
        </Button>
      )}
      {!canPay && paymentStatus === "paid" && (
        <Button size="sm" variant="subtle" disabled={!!loading} onClick={() => run("unpaid", () => setAppointmentPaymentStatus(id, "unpaid"))}>
          <DollarSign className="h-4 w-4" /> Mark Unpaid
        </Button>
      )}
      {canPay && (
        <Button
          size="sm"
          variant="subtle"
          disabled={!!loading}
          onClick={() =>
            run("link", async () => {
              const res = await createAppointmentCheckoutSession(id);
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
          size="sm"
          variant="subtle"
          disabled={!!loading}
          onClick={() => {
            if (!confirm("Refund this payment? This issues a real Stripe refund if the payment was made via card.")) return;
            run("refund", () => refundAppointmentPayment(id));
          }}
        >
          {loading === "refund" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          Refund
        </Button>
      )}
      <Button
        size="sm"
        variant="danger"
        disabled={!!loading}
        onClick={async () => {
          if (!confirm("Delete this appointment? This cannot be undone.")) return;
          setLoading("delete");
          await deleteAppointment(id);
          toast.success("Appointment deleted");
          router.push("/admin/appointments");
          router.refresh();
        }}
      >
        <Trash2 className="h-4 w-4" /> Delete
      </Button>
    </div>
  );
}
