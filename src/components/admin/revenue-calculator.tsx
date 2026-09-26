"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { saveScenario, deleteScenario, listScenarios, type ScenarioInputs } from "@/lib/actions/scenarios";
import { SUBSCRIPTION_PLANS } from "@/lib/plans";

// Business prices come from the plan catalog (same source as Stripe billing).
const PRICES = {
  individual: 125,
  business10: SUBSCRIPTION_PLANS.business10.monthlyCents / 100,
  business30: SUBSCRIPTION_PLANS.business30.monthlyCents / 100,
  additional: SUBSCRIPTION_PLANS.business10.overagePerNotarizationCents / 100,
};

const PRESETS: Record<string, ScenarioInputs> = {
  Conservative: { individualAppointments: 10, business10Clients: 1, business30Clients: 0, additionalNotarizations: 0, customRevenueDollars: 0, expensesDollars: 300 },
  Target: { individualAppointments: 16, business10Clients: 2, business30Clients: 1, additionalNotarizations: 5, customRevenueDollars: 0, expensesDollars: 450 },
  Aggressive: { individualAppointments: 25, business10Clients: 3, business30Clients: 2, additionalNotarizations: 15, customRevenueDollars: 0, expensesDollars: 650 },
};

export function RevenueCalculator({ remainingGoalCents }: { remainingGoalCents: number }) {
  const [inputs, setInputs] = useState<ScenarioInputs>(PRESETS.Target);
  const [scenarios, setScenarios] = useState<{ id: string; name: string; inputs: ScenarioInputs }[]>([]);
  const [saving, setSaving] = useState(false);
  const [scenarioName, setScenarioName] = useState("");

  useEffect(() => {
    listScenarios().then(setScenarios);
  }, []);

  const results = useMemo(() => {
    const monthlyRevenue =
      inputs.individualAppointments * PRICES.individual +
      inputs.business10Clients * PRICES.business10 +
      inputs.business30Clients * PRICES.business30 +
      inputs.additionalNotarizations * PRICES.additional +
      inputs.customRevenueDollars;
    const annualizedRevenue = monthlyRevenue * 12;
    const profit = monthlyRevenue - inputs.expensesDollars;
    const remainingGoalDollars = remainingGoalCents / 100;
    const monthsToCloseGap = monthlyRevenue > 0 ? remainingGoalDollars / monthlyRevenue : Infinity;
    const additionalBusiness10Needed = Math.max(0, Math.ceil(remainingGoalDollars / PRICES.business10));
    const additionalBusiness30Needed = Math.max(0, Math.ceil(remainingGoalDollars / PRICES.business30));
    const additionalIndividualNeeded = Math.max(0, Math.ceil(remainingGoalDollars / PRICES.individual));
    return { monthlyRevenue, annualizedRevenue, profit, remainingGoalDollars, monthsToCloseGap, additionalBusiness10Needed, additionalBusiness30Needed, additionalIndividualNeeded };
  }, [inputs, remainingGoalCents]);

  function set<K extends keyof ScenarioInputs>(key: K, value: number) {
    setInputs((prev: any) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!scenarioName.trim()) { toast.error("Name your scenario first"); return; }
    setSaving(true);
    await saveScenario(scenarioName, inputs);
    setSaving(false);
    setScenarioName("");
    toast.success("Scenario saved");
    listScenarios().then(setScenarios);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Revenue Calculator</CardTitle>
          <div className="flex gap-2">
            {Object.keys(PRESETS).map((name: any) => (
              <Button key={name} size="sm" variant="subtle" onClick={() => setInputs(PRESETS[name])}>{name}</Button>
            ))}
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Individual Appointments ($125 ea)</Label>
              <Input type="number" min={0} value={inputs.individualAppointments} onChange={(e) => set("individualAppointments", Number(e.target.value))} />
            </div>
            <div>
              <Label>Business10 Clients (${PRICES.business10.toLocaleString()}/mo ea)</Label>
              <Input type="number" min={0} value={inputs.business10Clients} onChange={(e) => set("business10Clients", Number(e.target.value))} />
            </div>
            <div>
              <Label>Business30 Clients (${PRICES.business30.toLocaleString()}/mo ea)</Label>
              <Input type="number" min={0} value={inputs.business30Clients} onChange={(e) => set("business30Clients", Number(e.target.value))} />
            </div>
            <div>
              <Label>Additional Notarizations (${PRICES.additional} ea)</Label>
              <Input type="number" min={0} value={inputs.additionalNotarizations} onChange={(e) => set("additionalNotarizations", Number(e.target.value))} />
            </div>
            <div>
              <Label>Custom Revenue ($)</Label>
              <Input type="number" min={0} value={inputs.customRevenueDollars} onChange={(e) => set("customRevenueDollars", Number(e.target.value))} />
            </div>
            <div>
              <Label>Monthly Expenses ($)</Label>
              <Input type="number" min={0} value={inputs.expensesDollars} onChange={(e) => set("expensesDollars", Number(e.target.value))} />
            </div>
          </div>

          <div className="flex items-end gap-2 border-t border-navy-100 pt-4">
            <div className="flex-1">
              <Label>Save This Scenario</Label>
              <Input value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} placeholder="e.g. Q3 push" />
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </div>

          {scenarios.length > 0 && (
            <div className="space-y-2">
              {scenarios.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg bg-navy-50 px-3 py-2">
                  <button onClick={() => setInputs(s.inputs)} className="text-sm font-medium text-navy-700 hover:text-accent-600">{s.name}</button>
                  <button
                    onClick={async () => { await deleteScenario(s.id); setScenarios((prev: any) => prev.filter((x: any) => x.id !== s.id)); }}
                    className="text-navy-300 hover:text-danger-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Projected Results</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <ResultRow label="Monthly Revenue" value={`$${results.monthlyRevenue.toLocaleString()}`} highlight />
          <ResultRow label="Annualized Revenue" value={`$${results.annualizedRevenue.toLocaleString()}`} />
          <ResultRow label="Monthly Profit" value={`$${results.profit.toLocaleString()}`} tone={results.profit >= 0 ? "success" : "danger"} />
          <ResultRow label="Remaining Toward $50K Goal" value={`$${results.remainingGoalDollars.toLocaleString()}`} />
          <ResultRow
            label="Time to Close Gap at This Pace"
            value={Number.isFinite(results.monthsToCloseGap) ? `${results.monthsToCloseGap.toFixed(1)} months` : "—"}
          />
          <ResultRow label="Or ~ Business10 Client-Months Needed" value={String(results.additionalBusiness10Needed)} />
          <ResultRow label="Or ~ Business30 Client-Months Needed" value={String(results.additionalBusiness30Needed)} />
          <ResultRow label="Or ~ Additional Individual Appointments Needed" value={String(results.additionalIndividualNeeded)} />
        </CardBody>
      </Card>
    </div>
  );
}

function ResultRow({ label, value, highlight, tone }: { label: string; value: string; highlight?: boolean; tone?: "success" | "danger" }) {
  return (
    <div className="flex items-center justify-between border-b border-navy-50 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-navy-500">{label}</span>
      <span
        className={`font-bold ${highlight ? "text-xl text-navy-900" : "text-navy-800"} ${tone === "success" ? "text-success-600" : tone === "danger" ? "text-danger-600" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
