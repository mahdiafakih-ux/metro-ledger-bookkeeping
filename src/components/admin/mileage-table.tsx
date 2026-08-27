"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deleteMileageLog } from "@/lib/actions/mileage";
import { formatDate } from "@/lib/utils";

export interface MileageRow {
  id: string;
  date: Date;
  startLocation: string;
  destination: string;
  purpose: string;
  miles: number;
  clientName: string;
}

export function MileageTable({ rows }: { rows: MileageRow[] }) {
  const router = useRouter();
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-navy-50 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
          <tr>
            <th className="px-5 py-3">Date</th>
            <th className="px-5 py-3">From</th>
            <th className="px-5 py-3">To</th>
            <th className="px-5 py-3">Purpose</th>
            <th className="px-5 py-3">Client</th>
            <th className="px-5 py-3">Miles</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-100">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-navy-50">
              <td className="px-5 py-3.5 text-navy-500">{formatDate(r.date)}</td>
              <td className="px-5 py-3.5 text-navy-600">{r.startLocation}</td>
              <td className="px-5 py-3.5 text-navy-600">{r.destination}</td>
              <td className="px-5 py-3.5 text-navy-500">{r.purpose || "—"}</td>
              <td className="px-5 py-3.5 text-navy-500">{r.clientName || "—"}</td>
              <td className="px-5 py-3.5 font-semibold text-navy-900">{r.miles.toFixed(1)}</td>
              <td className="px-5 py-3.5 text-right">
                <button
                  onClick={async () => { await deleteMileageLog(r.id); toast.success("Deleted"); router.refresh(); }}
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
