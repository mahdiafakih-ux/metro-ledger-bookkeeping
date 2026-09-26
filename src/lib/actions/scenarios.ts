"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";

export interface ScenarioInputs {
  individualAppointments: number;
  business10Clients: number;
  business30Clients: number;
  additionalNotarizations: number; // overage notarizations across all business clients
  customRevenueDollars: number;
  expensesDollars: number;
}

/**
 * Normalise saved scenarios. Scenarios saved before the Business10/30
 * change carried `unlimitedClients` and `additionalAppointments`; the
 * discontinued Unlimited count is dropped and the old field renamed, so old
 * scenarios still load (the stored JSON itself is left untouched).
 */
function normalizeInputs(raw: Record<string, unknown>): ScenarioInputs {
  const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0);
  return {
    individualAppointments: n(raw.individualAppointments),
    business10Clients: n(raw.business10Clients),
    business30Clients: n(raw.business30Clients),
    additionalNotarizations: n(raw.additionalNotarizations ?? raw.additionalAppointments),
    customRevenueDollars: n(raw.customRevenueDollars),
    expensesDollars: n(raw.expensesDollars),
  };
}

export async function saveScenario(name: string, inputs: ScenarioInputs) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const cleanName = String(name).trim().slice(0, 80);
  if (!cleanName) return { success: false, error: "Name required" };
  await prisma.savedScenario.create({ data: { name: cleanName, inputsJson: JSON.stringify(normalizeInputs(inputs as unknown as Record<string, unknown>)) } });
  revalidatePath("/admin/revenue");
  return { success: true };
}

export async function deleteScenario(id: string) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  await prisma.savedScenario.delete({ where: { id } });
  revalidatePath("/admin/revenue");
  return { success: true };
}

export async function listScenarios() {
  const session = await requireAdminSession();
  if (!session) return [];

  const rows = await prisma.savedScenario.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map((r) => {
    let raw: Record<string, unknown> = {};
    try {
      raw = JSON.parse(r.inputsJson);
    } catch {
      raw = {};
    }
    return { id: r.id, name: r.name, inputs: normalizeInputs(raw), createdAt: r.createdAt };
  });
}
