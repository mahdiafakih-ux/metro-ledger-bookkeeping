"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea, FormField } from "@/components/ui/form";
import { createInvoice, type InvoiceInput, type InvoiceItemInput } from "@/lib/actions/invoices";
import { INVOICE_STATUSES } from "@/lib/constants";
import { titleCase } from "@/lib/utils";

interface ClientOption { id: string; name: string; company: string; email: string }
interface BusinessOption { id: string; companyName: string; contactName: string; email: string }

export function InvoiceForm({ clients, businesses }: { clients: ClientOption[]; businesses: BusinessOption[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [clientId, setClientId] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [clientName, setClientName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [taxDollars, setTaxDollars] = useState(0);
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [status, setStatus] = useState("draft");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItemInput[]>([
    { description: "Statutory notarial fee", type: "statutory_fee", quantity: 1, unitAmountDollars: 10 },
    { description: "Signing agent & service fee", type: "other_service", quantity: 1, unitAmountDollars: 115 },
  ]);

  const total = useMemo(() => items.reduce((sum, i) => sum + i.quantity * i.unitAmountDollars, 0), [items]);

  function updateItem(idx: number, patch: Partial<InvoiceItemInput>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const input: InvoiceInput = { clientId: clientId || undefined, businessId: businessId || undefined, clientName, company, email, issueDate, dueDate, status, taxDollars, notes, items };
    const res = await createInvoice(input);
    setSaving(false);
    if (!res.success) { toast.error("Could not create invoice"); return; }
    toast.success("Invoice created");
    router.push(`/admin/invoices/${res.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Link Existing Client">
          <Select value={clientId} onChange={(e) => {
            setClientId(e.target.value); setBusinessId("");
            const c = clients.find((x) => x.id === e.target.value);
            if (c) { setClientName(c.name); setCompany(c.company); setEmail(c.email); }
          }}>
            <option value="">— None —</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </FormField>
        <FormField label="Link Existing Business">
          <Select value={businessId} onChange={(e) => {
            setBusinessId(e.target.value); setClientId("");
            const b = businesses.find((x) => x.id === e.target.value);
            if (b) { setClientName(b.contactName || b.companyName); setCompany(b.companyName); setEmail(b.email); }
          }}>
            <option value="">— None —</option>
            {businesses.map((b) => <option key={b.id} value={b.id}>{b.companyName}</option>)}
          </Select>
        </FormField>
        <FormField label="Bill To (Name)"><Input required value={clientName} onChange={(e) => setClientName(e.target.value)} /></FormField>
        <FormField label="Company"><Input value={company} onChange={(e) => setCompany(e.target.value)} /></FormField>
        <FormField label="Email" hint="Where the payment link/invoice can be sent"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></FormField>
        <FormField label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {INVOICE_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </Select>
        </FormField>
        <FormField label="Issue Date"><Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></FormField>
        <FormField label="Due Date"><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></FormField>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-bold uppercase tracking-wide text-navy-400">Line Items</p>
          <Button type="button" size="sm" variant="subtle" onClick={() => setItems((prev) => [...prev, { description: "", type: "other_service", quantity: 1, unitAmountDollars: 0 }])}>
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 rounded-lg border border-navy-100 p-3">
              <Input className="col-span-5" placeholder="Description" value={item.description} onChange={(e) => updateItem(idx, { description: e.target.value })} />
              <Select className="col-span-3" value={item.type} onChange={(e) => updateItem(idx, { type: e.target.value })}>
                <option value="statutory_fee">Statutory Fee</option>
                <option value="other_service">Other Service</option>
              </Select>
              <Input className="col-span-1" type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} />
              <Input className="col-span-2" type="number" min={0} step="0.01" value={item.unitAmountDollars} onChange={(e) => updateItem(idx, { unitAmountDollars: Number(e.target.value) })} />
              <button type="button" onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))} className="col-span-1 flex items-center justify-center text-navy-300 hover:text-danger-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-end gap-4">
          <FormField label="Tax ($)"><Input type="number" min={0} step="0.01" value={taxDollars} onChange={(e) => setTaxDollars(Number(e.target.value))} className="w-28" /></FormField>
          <p className="text-lg font-bold text-navy-900">Total: ${(total + taxDollars).toFixed(2)}</p>
        </div>
      </div>

      <FormField label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></FormField>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Create Invoice
        </Button>
      </div>
    </form>
  );
}
