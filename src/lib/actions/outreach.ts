"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface OutreachInput {
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  companyType: string;
  dateContacted: string;
  method: string;
  response: string;
  followUpDate?: string;
  notes: string;
  status: string;
}

export async function createOutreachEntry(input: OutreachInput) {
  await prisma.outreachLog.create({
    data: {
      businessName: input.businessName,
      contactName: input.contactName,
      phone: input.phone,
      email: input.email,
      companyType: input.companyType,
      dateContacted: new Date(input.dateContacted),
      method: input.method,
      response: input.response,
      followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
      notes: input.notes,
      status: input.status,
    },
  });
  revalidatePath("/admin/outreach");
  revalidatePath("/admin/scorecard");
  return { success: true };
}

export async function updateOutreachEntry(id: string, input: OutreachInput) {
  await prisma.outreachLog.update({
    where: { id },
    data: {
      businessName: input.businessName,
      contactName: input.contactName,
      phone: input.phone,
      email: input.email,
      companyType: input.companyType,
      dateContacted: new Date(input.dateContacted),
      method: input.method,
      response: input.response,
      followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
      notes: input.notes,
      status: input.status,
    },
  });
  revalidatePath("/admin/outreach");
  return { success: true };
}

export async function deleteOutreachEntry(id: string) {
  await prisma.outreachLog.delete({ where: { id } });
  revalidatePath("/admin/outreach");
  return { success: true };
}
