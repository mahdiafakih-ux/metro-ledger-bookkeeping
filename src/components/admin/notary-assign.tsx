"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { assignNotaryToAppointment } from "@/lib/actions/notaries";

export function NotaryAssign({
  appointmentId,
  current,
  notaries,
}: {
  appointmentId: string;
  current: string | null;
  notaries: { id: string; displayName: string; isActive: boolean }[];
}) {
  const [value, setValue] = useState(current ?? "");
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select aria-label="Assigned notary" value={value} onChange={(e) => setValue(e.target.value)} className="max-w-xs">
        <option value="">Unassigned</option>
        {notaries
          .filter((n) => n.isActive || n.id === current)
          .map((n) => (
            <option key={n.id} value={n.id}>
              {n.displayName}
              {!n.isActive ? " (inactive)" : ""}
            </option>
          ))}
      </Select>
      <Button
        size="sm"
        disabled={pending || value === (current ?? "")}
        onClick={() =>
          start(async () => {
            const res = await assignNotaryToAppointment(appointmentId, value || null);
            if (!res.success) return void toast.error(res.error);
            toast.success(value ? "Notary assigned" : "Notary unassigned");
            router.refresh();
          })
        }
      >
        Save
      </Button>
    </div>
  );
}
