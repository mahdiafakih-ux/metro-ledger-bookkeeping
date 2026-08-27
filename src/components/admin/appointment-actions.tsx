"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, XCircle, UserX, DollarSign, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setAppointmentStatus, setAppointmentPaymentStatus, deleteAppointment } from "@/lib/actions/appointments";

export function AppointmentActions({ id, status, paymentStatus }: { id: string; status: string; paymentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<{ success: boolean }>) {
    setLoading(key);
    await fn();
    setLoading(null);
    router.refresh();
  }

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
      <Button
        size="sm"
        variant="subtle"
        disabled={!!loading}
        onClick={() => run("payment", () => setAppointmentPaymentStatus(id, paymentStatus === "paid" ? "unpaid" : "paid"))}
      >
        <DollarSign className="h-4 w-4" /> Mark {paymentStatus === "paid" ? "Unpaid" : "Paid"}
      </Button>
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
