"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { updateInvoiceStatus, deleteInvoice } from "@/lib/actions/invoices";
import { INVOICE_STATUSES } from "@/lib/constants";
import { titleCase } from "@/lib/utils";

export function InvoiceActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();

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
      <Button variant="outline" onClick={() => window.print()}>
        <Printer className="h-4 w-4" /> Print / Save PDF
      </Button>
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
