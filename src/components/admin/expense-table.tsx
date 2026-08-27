"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deleteExpense } from "@/lib/actions/expenses";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/constants";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/utils";

export interface ExpenseRow {
  id: string;
  date: Date;
  description: string;
  category: string;
  vendor: string;
  amountCents: number;
}

export function ExpenseTable({ rows }: { rows: ExpenseRow[] }) {
  const router = useRouter();
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-navy-50 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
          <tr>
            <th className="px-5 py-3">Date</th>
            <th className="px-5 py-3">Description</th>
            <th className="px-5 py-3">Category</th>
            <th className="px-5 py-3">Vendor</th>
            <th className="px-5 py-3">Amount</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-100">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-navy-50">
              <td className="px-5 py-3.5 text-navy-500">{formatDate(r.date)}</td>
              <td className="px-5 py-3.5 font-medium text-navy-900">{r.description}</td>
              <td className="px-5 py-3.5 text-navy-600">{EXPENSE_CATEGORY_LABELS[r.category] ?? r.category}</td>
              <td className="px-5 py-3.5 text-navy-500">{r.vendor || "—"}</td>
              <td className="px-5 py-3.5 font-semibold text-navy-900">{formatCents(r.amountCents)}</td>
              <td className="px-5 py-3.5 text-right">
                <button
                  onClick={async () => { await deleteExpense(r.id); toast.success("Deleted"); router.refresh(); }}
                  className="text-navy-300 hover:text-danger-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
