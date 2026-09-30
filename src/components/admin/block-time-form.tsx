"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Ban, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, FormField } from "@/components/ui/form";
import { createAdminBlock, deleteAdminBlock } from "@/lib/actions/admin-blocks";
import { formatTime } from "@/lib/utils";

export function BlockTimeButton({ date }: { date: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await createAdminBlock({ date, startTime, endTime, reason });
    setSaving(false);
    if (!res.success) { toast.error(res.error ?? "Could not block time"); return; }
    toast.success("Time blocked");
    setOpen(false);
    setReason("");
    router.refresh();
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Ban className="h-4 w-4" /> Block Time
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-xl border border-navy-100 bg-white p-4">
      <FormField label="Start"><Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></FormField>
      <FormField label="End"><Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></FormField>
      <div className="min-w-40 flex-1"><FormField label="Reason"><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Lunch, personal" /></FormField></div>
      <Button type="submit" size="sm" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />} Block
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
    </form>
  );
}

export function BlockedTimeList({ blocks }: { blocks: { id: string; startTime: Date; endTime: Date; reason: string }[] }) {
  const router = useRouter();
  if (blocks.length === 0) return null;

  return (
    <div className="space-y-2">
      {blocks.map((b) => (
        <div key={b.id} className="flex items-center justify-between rounded-lg bg-navy-100 px-3 py-2 text-sm">
          <span className="font-medium text-navy-700">
            {formatTime(b.startTime)} – {formatTime(b.endTime)} {b.reason && `— ${b.reason}`}
          </span>
          <button
            onClick={async () => {
              await deleteAdminBlock(b.id);
              toast.success("Block removed");
              router.refresh();
            }}
            className="text-navy-400 hover:text-danger-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
