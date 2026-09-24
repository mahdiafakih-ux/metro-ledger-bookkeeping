"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label, Select, FormField } from "@/components/ui/form";
import { createAppointment, updateAppointment, type AppointmentInput } from "@/lib/actions/appointments";
import { APPOINTMENT_STATUSES, APPOINTMENT_TYPES, PAYMENT_METHODS, PAYMENT_STATUSES, SERVICE_TYPES } from "@/lib/constants";
import { titleCase } from "@/lib/utils";

interface ClientOption { id: string; name: string; company: string; email: string; phone: string }
interface BusinessOption { id: string; companyName: string; contactName: string; email: string; phone: string }

export function AppointmentForm({
  appointmentId,
  initial,
  clients,
  businesses,
}: {
  appointmentId?: string;
  initial?: Partial<AppointmentInput>;
  clients: ClientOption[];
  businesses: BusinessOption[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [type, setType] = useState(initial?.type ?? "in_person");
  const [status, setStatus] = useState(initial?.status ?? "scheduled");
  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const [businessId, setBusinessId] = useState(initial?.businessId ?? "");
  const [clientName, setClientName] = useState(initial?.clientName ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [serviceType, setServiceType] = useState(initial?.serviceType ?? "General Notary");
  const [documentType, setDocumentType] = useState(initial?.documentType ?? "");
  const [numberOfActs, setNumberOfActs] = useState(initial?.numberOfActs ?? 1);
  const [statutoryFee, setStatutoryFee] = useState((initial?.statutoryFeeCents ?? 1000) / 100);
  const [travelFee, setTravelFee] = useState((initial?.travelFeeCents ?? 0) / 100);
  const [otherFees, setOtherFees] = useState((initial?.otherFeesCents ?? 11500) / 100);
  const [scheduledStart, setScheduledStart] = useState(initial?.scheduledStart ?? "");
  const [paymentStatus, setPaymentStatus] = useState(initial?.paymentStatus ?? "unpaid");
  const [paymentMethod, setPaymentMethod] = useState(initial?.paymentMethod ?? "card");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [followUpDate, setFollowUpDate] = useState(initial?.followUpDate ?? "");
  const [isRecurring, setIsRecurring] = useState(initial?.isRecurring ?? false);
  const [recurrenceRule, setRecurrenceRule] = useState(initial?.recurrenceRule ?? "monthly");

  const totalCents = useMemo(
    () => Math.round((statutoryFee + travelFee + otherFees) * 100),
    [statutoryFee, travelFee, otherFees]
  );

  function applyClient(id: string) {
    setClientId(id);
    setBusinessId("");
    const c = clients.find((x) => x.id === id);
    if (c) {
      setClientName(c.name);
      setCompany(c.company);
      setEmail(c.email);
      setPhone(c.phone);
    }
  }

  function applyBusiness(id: string) {
    setBusinessId(id);
    setClientId("");
    const b = businesses.find((x) => x.id === id);
    if (b) {
      setClientName(b.contactName || b.companyName);
      setCompany(b.companyName);
      setEmail(b.email);
      setPhone(b.phone);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const input: AppointmentInput = {
      type,
      status,
      clientId: clientId || undefined,
      businessId: businessId || undefined,
      clientName,
      company,
      email,
      phone,
      address,
      serviceType,
      documentType,
      numberOfActs,
      statutoryFeeCents: Math.round(statutoryFee * 100),
      travelFeeCents: Math.round(travelFee * 100),
      otherFeesCents: Math.round(otherFees * 100),
      totalAmountCents: totalCents,
      scheduledStart,
      paymentStatus,
      paymentMethod,
      notes,
      followUpDate: followUpDate || undefined,
      isRecurring,
      recurrenceRule: isRecurring ? recurrenceRule : "",
    };

    const res = appointmentId ? await updateAppointment(appointmentId, input) : await createAppointment(input);
    setSaving(false);
    if (!res.success) {
      toast.error(("error" in res && res.error) || "Could not save appointment");
      return;
    }
    toast.success(appointmentId ? "Appointment updated" : "Appointment created");
    router.push(appointmentId ? `/admin/appointments/${appointmentId}` : "/admin/appointments");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-navy-400">Appointment</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Type">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {APPOINTMENT_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
            </Select>
          </FormField>
          <FormField label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {APPOINTMENT_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
            </Select>
          </FormField>
          <FormField label="Date & Time">
            <Input type="datetime-local" required value={scheduledStart} onChange={(e) => setScheduledStart(e.target.value)} />
          </FormField>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-navy-400">Client</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Link Existing Client (optional)">
            <Select value={clientId} onChange={(e) => applyClient(e.target.value)}>
              <option value="">— None —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</option>)}
            </Select>
          </FormField>
          <FormField label="Link Existing Business (optional)">
            <Select value={businessId} onChange={(e) => applyBusiness(e.target.value)}>
              <option value="">— None —</option>
              {businesses.map((b) => <option key={b.id} value={b.id}>{b.companyName}</option>)}
            </Select>
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Full Name"><Input required value={clientName} onChange={(e) => setClientName(e.target.value)} /></FormField>
          <FormField label="Company"><Input value={company} onChange={(e) => setCompany(e.target.value)} /></FormField>
          <FormField label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></FormField>
          <FormField label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></FormField>
        </div>
        <FormField label="Address"><Input value={address} onChange={(e) => setAddress(e.target.value)} /></FormField>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-navy-400">Document Details</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Service Type">
            <Select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
              {SERVICE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </FormField>
          <FormField label="Document Type"><Input value={documentType} onChange={(e) => setDocumentType(e.target.value)} /></FormField>
          <FormField label="Number of Notarial Acts">
            <Input type="number" min={1} value={numberOfActs} onChange={(e) => setNumberOfActs(Number(e.target.value))} />
          </FormField>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-navy-400">Pricing & Payment</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Statutory Fee ($)" hint="Michigan-limited to $10/act">
            <Input type="number" min={0} step="0.01" value={statutoryFee} onChange={(e) => setStatutoryFee(Number(e.target.value))} />
          </FormField>
          <FormField label="Travel/Service Fee ($)">
            <Input type="number" min={0} step="0.01" value={travelFee} onChange={(e) => setTravelFee(Number(e.target.value))} />
          </FormField>
          <FormField label="Other Fees ($)" hint="Signing agent, admin, handling">
            <Input type="number" min={0} step="0.01" value={otherFees} onChange={(e) => setOtherFees(Number(e.target.value))} />
          </FormField>
        </div>
        <div className="rounded-xl bg-navy-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">Total Service Amount</p>
          <p className="mt-1 text-2xl font-bold text-navy-900">${(totalCents / 100).toFixed(2)}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Payment Status">
            <Select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
              {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
            </Select>
          </FormField>
          <FormField label="Payment Method">
            <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{titleCase(m)}</option>)}
            </Select>
          </FormField>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-navy-400">Follow-up & Notes</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Follow-Up Date">
            <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
          </FormField>
          <div>
            <Label>Recurring Appointment</Label>
            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-2 text-sm text-navy-600">
                <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="h-4 w-4 rounded border-navy-300" />
                Repeats
              </label>
              {isRecurring && (
                <Select value={recurrenceRule} onChange={(e) => setRecurrenceRule(e.target.value)} className="w-auto">
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </Select>
              )}
            </div>
          </div>
        </div>
        <FormField label="Client Notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </FormField>
      </section>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {appointmentId ? "Save Changes" : "Create Appointment"}
        </Button>
      </div>
    </form>
  );
}
