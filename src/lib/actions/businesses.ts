"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { dollarsToCents } from "@/lib/money";
import { requireAdminSession } from "@/lib/auth";

export interface BusinessInput {
  companyName: string;
  category: string;
  contactName: string;
  email: string;
  phone: string;
  billingContactName: string;
  billingContactEmail: string;
  billingContactPhone: string;
  packageKey: string;
  monthlyUsage: number;
  monthlyRevenueDollars: number;
  expectedMonthlyVolume: number;
  customPricingNotes: string;
  status: string;
  contractStart?: string;
  contractEndDate?: string;
  renewalDate?: string;
  notes: string;
  followUpDate?: string;
  leadSource: string;
}

export async function createBusiness(input: BusinessInput) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const business = await prisma.business.create({
    data: {
      companyName: input.companyName,
      category: input.category,
      contactName: input.contactName,
      email: input.email,
      phone: input.phone,
      billingContactName: input.billingContactName,
      billingContactEmail: input.billingContactEmail,
      billingContactPhone: input.billingContactPhone,
      packageKey: input.packageKey,
      monthlyUsage: input.monthlyUsage,
      monthlyRevenueCents: dollarsToCents(input.monthlyRevenueDollars),
      expectedMonthlyVolume: input.expectedMonthlyVolume,
      customPricingNotes: input.customPricingNotes,
      status: input.status,
      contractStart: input.contractStart ? new Date(input.contractStart) : null,
      contractEndDate: input.contractEndDate ? new Date(input.contractEndDate) : null,
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
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  await prisma.business.update({
    where: { id },
    data: {
      companyName: input.companyName,
      category: input.category,
      contactName: input.contactName,
      email: input.email,
      phone: input.phone,
      billingContactName: input.billingContactName,
      billingContactEmail: input.billingContactEmail,
      billingContactPhone: input.billingContactPhone,
      packageKey: input.packageKey,
      monthlyUsage: input.monthlyUsage,
      monthlyRevenueCents: dollarsToCents(input.monthlyRevenueDollars),
      expectedMonthlyVolume: input.expectedMonthlyVolume,
      customPricingNotes: input.customPricingNotes,
      status: input.status,
      contractStart: input.contractStart ? new Date(input.contractStart) : null,
      contractEndDate: input.contractEndDate ? new Date(input.contractEndDate) : null,
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
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  await prisma.business.delete({ where: { id } });
  revalidatePath("/admin/businesses");
  return { success: true };
}
