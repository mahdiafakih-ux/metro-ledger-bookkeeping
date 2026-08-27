"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { dollarsToCents } from "@/lib/money";
import { requireAdminSession } from "@/lib/auth";

export interface ClientInput {
  name: string;
  company: string;
  email: string;
  phone: string;
  clientType: string;
  currentPackage: string;
  amountOwedDollars: number;
  notes: string;
  followUpDate?: string;
  leadStatus: string;
  leadSource: string;
}

export async function createClient(input: ClientInput) {
  const session = await requireAdminSession();
  if (!session) return { success: false as const, error: "Unauthorized" };

  const client = await prisma.client.create({
    data: {
      name: input.name,
      company: input.company,
      email: input.email,
      phone: input.phone,
      clientType: input.clientType,
      currentPackage: input.currentPackage,
      amountOwedCents: dollarsToCents(input.amountOwedDollars),
      notes: input.notes,
      followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
      leadStatus: input.leadStatus,
      leadSource: input.leadSource,
    },
  });
  revalidatePath("/admin/clients");
  return { success: true, id: client.id };
}

export async function updateClient(id: string, input: ClientInput) {
  const session = await requireAdminSession();
  if (!session) return { success: false as const, error: "Unauthorized" };

  await prisma.client.update({
    where: { id },
    data: {
      name: input.name,
      company: input.company,
      email: input.email,
      phone: input.phone,
      clientType: input.clientType,
      currentPackage: input.currentPackage,
      amountOwedCents: dollarsToCents(input.amountOwedDollars),
      notes: input.notes,
      followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
      leadStatus: input.leadStatus,
      leadSource: input.leadSource,
    },
  });
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${id}`);
  return { success: true };
}

export async function deleteClient(id: string) {
  const session = await requireAdminSession();
  if (!session) return { success: false as const, error: "Unauthorized" };

  await prisma.client.delete({ where: { id } });
  revalidatePath("/admin/clients");
  return { success: true };
}
