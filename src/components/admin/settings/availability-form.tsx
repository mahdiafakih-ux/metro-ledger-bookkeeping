"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, FormField } from "@/components/ui/form";
import { saveAvailability } from "@/lib/actions/availability";
import { addBlackoutDate, removeBlackoutDate } from "@/lib/actions/availability";
import { DAY_NAMES } from "@/lib/constants";
import { formatDateOnly } from "@/lib/tz";

export function AvailabilityForm({ initial }: {
  initial: {
    activeDays: number[]; startTime: string; endTime: string;
    appointmentDurationMinutes: number; bufferMinutes: number; minNoticeHours: number; maxAdvanceDays: number;
    vacationMode: boolean; vacationMessage: string;
  };
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initial);

  function toggleDay(day: number) {
    setForm((prev: any) => ({
      ...prev,
      activeDays: prev.activeDays.includes(day) ? prev.activeDays.filter((d: any) => d !== day) : [...prev.activeDays, day].sort(),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await saveAvailability(form);
    setSaving(false);
    toast.success("Availability saved");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-navy-500">Working Days</p>
        <div className="flex flex-wrap gap-2">
          {DAY_NAMES.map((name, i) => (
            <button
              type="button"
              key={name}
              onClick={() => toggleDay(i)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${form.activeDays.includes(i) ? "bg-accent-500 text-white" : "bg-navy-100 text-navy-500"}`}
            >
              {name.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Start Time"><Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></FormField>
        <FormField label="End Time"><Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></FormField>
        <FormField label="Appointment Duration (minutes)"><Input type="number" min={5} value={form.appointmentDurationMinutes} onChange={(e) => setForm({ ...form, appointmentDurationMinutes: Number(e.target.value) })} /></FormField>
        <FormField label="Buffer Between Appointments (minutes)"><Input type="number" min={0} value={form.bufferMinutes} onChange={(e) => setForm({ ...form, bufferMinutes: Number(e.target.value) })} /></FormField>
        <FormField label="Minimum Notice (hours)"><Input type="number" min={0} value={form.minNoticeHours} onChange={(e) => setForm({ ...form, minNoticeHours: Number(e.target.value) })} /></FormField>
        <FormField label="Maximum Advance Booking (days)"><Input type="number" min={1} value={form.maxAdvanceDays} onChange={(e) => setForm({ ...form, maxAdvanceDays: Number(e.target.value) })} /></FormField>
      </div>
      <label className="flex items-center gap-2 text-sm text-navy-700">
        <input type="checkbox" checked={form.vacationMode} onChange={(e) => setForm({ ...form, vacationMode: e.target.checked })} className="h-4 w-4 rounded border-navy-300" />
        Vacation mode (pauses all public booking)
      </label>
      {form.vacationMode && (
        <FormField label="Vacation Message"><Input value={form.vacationMessage} onChange={(e) => setForm({ ...form, vacationMessage: e.target.value })} placeholder="We'll be back on..." /></FormField>
      )}
      <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Availability</Button>
    </form>
  );
}

export function BlackoutDatesManager({ initial }: { initial: { id: string; date: Date; reason: string }[] }) {
  const router = useRouter();
  const [dates, setDates] = useState(initial);
  const [newDate, setNewDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newDate) return;
    setSaving(true);
    await addBlackoutDate(newDate, reason);
    setSaving(false);
    setNewDate(""); setReason("");
    toast.success("Blackout date added");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
        <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy-500">Date</label><Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} /></div>
        <div className="flex-1 min-w-40"><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-navy-500">Reason</label><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Holiday" /></div>
        <Button type="submit" disabled={saving}><Plus className="h-4 w-4" /> Add</Button>
      </form>
      {dates.length > 0 && (
        <ul className="divide-y divide-navy-100 rounded-lg border border-navy-100">
          {dates.map((d: any) => (
            <li key={d.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="font-medium text-navy-700">{formatDateOnly(d.date)} {d.reason && `— ${d.reason}`}</span>
              <button
                onClick={async () => { await removeBlackoutDate(d.id); setDates((prev: any) => prev.filter((x: any) => x.id !== d.id)); }}
                className="text-navy-300 hover:text-danger-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
