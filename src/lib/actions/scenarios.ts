"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface ScenarioInputs {
  individualAppointments: number;
  business20Clients: number;
  unlimitedClients: number;
  additionalAppointments: number;
  customRevenueDollars: number;
  expensesDollars: number;
}

export async function saveScenario(name: string, inputs: ScenarioInputs) {
  await prisma.savedScenario.create({ data: { name, inputsJson: JSON.stringify(inputs) } });
  revalidatePath("/admin/revenue");
  return { success: true };
}

export async function deleteScenario(id: string) {
  await prisma.savedScenario.delete({ where: { id } });
  revalidatePath("/admin/revenue");
  return { success: true };
}

export async function listScenarios() {
  const rows = await prisma.savedScenario.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map((r) => ({ id: r.id, name: r.name, inputs: JSON.parse(r.inputsJson) as ScenarioInputs, createdAt: r.createdAt }));
}
