"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { addManualRevenueEntry } from "@/lib/actions/revenue";

export function AddRevenueForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await addManualRevenueEntry({ amountDollars: Number(amount), description, date });
    setSaving(false);
    if (!res.success) {
      toast.error(res.error ?? "Could not save entry");
      return;
    }
    toast.success("Revenue entry added");
    setAmount("");
    setDescription("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Add Revenue
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-xl border border-navy-100 bg-white p-4">
      <div>
        <Label>Amount ($)</Label>
        <Input type="number" min="0" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-32" />
      </div>
      <div>
        <Label>Date</Label>
        <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="min-w-48 flex-1">
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Cash appointment" />
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Save
      </Button>
      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
    </form>
  );
}
