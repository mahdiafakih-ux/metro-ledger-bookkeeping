"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { createMileageLog } from "@/lib/actions/mileage";

export function MileageQuickAdd() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startLocation, setStartLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [purpose, setPurpose] = useState("");
  const [miles, setMiles] = useState("");
  const [clientName, setClientName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startLocation.trim() || !destination.trim() || !miles) return;
    setSaving(true);
    const res = await createMileageLog({ date, startLocation, destination, purpose, miles: Number(miles), clientName });
    setSaving(false);
    if (!res.success) { toast.error("Could not save"); return; }
    toast.success("Trip logged");
    setStartLocation(""); setDestination(""); setPurpose(""); setMiles(""); setClientName("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-2xl border border-navy-100 bg-white p-4 sm:grid-cols-3 lg:grid-cols-7">
      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Input placeholder="Starting location" required value={startLocation} onChange={(e) => setStartLocation(e.target.value)} />
      <Input placeholder="Destination" required value={destination} onChange={(e) => setDestination(e.target.value)} />
      <Input placeholder="Business purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
      <Input placeholder="Client" value={clientName} onChange={(e) => setClientName(e.target.value)} />
      <Input type="number" min="0" step="0.1" placeholder="Miles" required value={miles} onChange={(e) => setMiles(e.target.value)} />
      <Button type="submit" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Log Trip
      </Button>
    </form>
  );
}
