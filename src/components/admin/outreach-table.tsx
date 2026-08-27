"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Badge, STATUS_TONES } from "@/components/ui/badge";
import { deleteOutreachEntry } from "@/lib/actions/outreach";
import { BUSINESS_CATEGORY_LABELS, OUTREACH_METHOD_LABELS, OUTREACH_RESPONSE_LABELS } from "@/lib/constants";
import { formatDate, titleCase } from "@/lib/utils";

export interface OutreachRow {
  id: string;
  businessName: string;
  contactName: string;
  companyType: string;
  dateContacted: Date;
  method: string;
  response: string;
  followUpDate: Date | null;
  status: string;
}

export function OutreachTable({ rows }: { rows: OutreachRow[] }) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-sm">
        <thead className="bg-navy-50 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
          <tr>
            <th className="px-5 py-3">Business</th>
            <th className="px-5 py-3">Type</th>
            <th className="px-5 py-3">Date</th>
            <th className="px-5 py-3">Method</th>
            <th className="px-5 py-3">Response</th>
            <th className="px-5 py-3">Follow-Up</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-100">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-navy-50">
              <td className="px-5 py-3.5">
                <p className="font-semibold text-navy-900">{r.businessName}</p>
                {r.contactName && <p className="text-xs text-navy-400">{r.contactName}</p>}
              </td>
              <td className="px-5 py-3.5 text-navy-600">{BUSINESS_CATEGORY_LABELS[r.companyType] ?? titleCase(r.companyType)}</td>
              <td className="px-5 py-3.5 text-navy-500">{formatDate(r.dateContacted)}</td>
              <td className="px-5 py-3.5 text-navy-600">{OUTREACH_METHOD_LABELS[r.method]}</td>
              <td className="px-5 py-3.5 text-navy-600">{OUTREACH_RESPONSE_LABELS[r.response]}</td>
              <td className="px-5 py-3.5 text-navy-500">{r.followUpDate ? formatDate(r.followUpDate) : "—"}</td>
              <td className="px-5 py-3.5"><Badge tone={STATUS_TONES[r.status] ?? "neutral"}>{titleCase(r.status)}</Badge></td>
              <td className="px-5 py-3.5 text-right">
                <button
                  onClick={async () => {
                    await deleteOutreachEntry(r.id);
                    toast.success("Deleted");
                    router.refresh();
                  }}
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
