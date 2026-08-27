"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { createExpense } from "@/lib/actions/expenses";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from "@/lib/constants";

export function ExpenseQuickAdd() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || !amount) return;
    setSaving(true);
    const res = await createExpense({ date, description, category, vendor, amountDollars: Number(amount), notes: "" });
    setSaving(false);
    if (!res.success) { toast.error("Could not save"); return; }
    toast.success("Expense logged");
    setDescription(""); setVendor(""); setAmount("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-2xl border border-navy-100 bg-white p-4 sm:grid-cols-3 lg:grid-cols-6">
      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Input placeholder="Description" required value={description} onChange={(e) => setDescription(e.target.value)} className="lg:col-span-2" />
      <Select value={category} onChange={(e) => setCategory(e.target.value)}>
        {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c]}</option>)}
      </Select>
      <Input placeholder="Vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} />
      <Input type="number" min="0" step="0.01" placeholder="Amount ($)" required value={amount} onChange={(e) => setAmount(e.target.value)} />
      <Button type="submit" disabled={saving} className="lg:col-span-6">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Log Expense
      </Button>
    </form>
  );
}
