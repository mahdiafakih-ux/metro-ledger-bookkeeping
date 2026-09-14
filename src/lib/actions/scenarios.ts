"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";

export interface ScenarioInputs {
  individualAppointments: number;
  business30Clients: number;
  unlimitedClients: number;
  additionalAppointments: number;
  customRevenueDollars: number;
  expensesDollars: number;
}

export async function saveScenario(name: string, inputs: ScenarioInputs) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  await prisma.savedScenario.create({ data: { name, inputsJson: JSON.stringify(inputs) } });
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
  return rows.map((r: any) => ({ id: r.id, name: r.name, inputs: JSON.parse(r.inputsJson) as ScenarioInputs, createdAt: r.createdAt }));
}
