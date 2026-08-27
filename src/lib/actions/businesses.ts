"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { dollarsToCents } from "@/lib/money";

export interface BusinessInput {
  companyName: string;
  category: string;
  contactName: string;
  email: string;
  phone: string;
  packageKey: string;
  monthlyUsage: number;
  monthlyRevenueDollars: number;
  status: string;
  contractStart?: string;
  renewalDate?: string;
  notes: string;
  followUpDate?: string;
  leadSource: string;
}

export async function createBusiness(input: BusinessInput) {
  const business = await prisma.business.create({
    data: {
      companyName: input.companyName,
      category: input.category,
      contactName: input.contactName,
      email: input.email,
      phone: input.phone,
      packageKey: input.packageKey,
      monthlyUsage: input.monthlyUsage,
      monthlyRevenueCents: dollarsToCents(input.monthlyRevenueDollars),
      status: input.status,
      contractStart: input.contractStart ? new Date(input.contractStart) : null,
      renewalDate: input.renewalDate ? new Date(input.renewalDate) : null,
      notes: input.notes,
      followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
      leadSource: input.leadSource,
    },
  });
  revalidatePath("/admin/businesses");
  return { success: true, id: business.id };
}

export async function updateBusiness(id: string, input: BusinessInput) {
  await prisma.business.update({
    where: { id },
    data: {
      companyName: input.companyName,
      category: input.category,
      contactName: input.contactName,
      email: input.email,
      phone: input.phone,
      packageKey: input.packageKey,
      monthlyUsage: input.monthlyUsage,
      monthlyRevenueCents: dollarsToCents(input.monthlyRevenueDollars),
      status: input.status,
      contractStart: input.contractStart ? new Date(input.contractStart) : null,
      renewalDate: input.renewalDate ? new Date(input.renewalDate) : null,
      notes: input.notes,
      followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
      leadSource: input.leadSource,
    },
  });
  revalidatePath("/admin/businesses");
  revalidatePath(`/admin/businesses/${id}`);
  return { success: true };
}

export async function deleteBusiness(id: string) {
  await prisma.business.delete({ where: { id } });
  revalidatePath("/admin/businesses");
  return { success: true };
}
