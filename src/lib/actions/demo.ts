"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function clearDemoData() {
  await prisma.revenueEntry.deleteMany({ where: { isDemo: true } });
  await prisma.mileageLog.deleteMany({ where: { isDemo: true } });
  await prisma.appointment.deleteMany({ where: { isDemo: true } });
  await prisma.invoice.deleteMany({ where: { isDemo: true } });
  await prisma.pipelineOpportunity.deleteMany({ where: { isDemo: true } });
  await prisma.outreachLog.deleteMany({ where: { isDemo: true } });
  await prisma.expense.deleteMany({ where: { isDemo: true } });
  await prisma.scorecardEntry.deleteMany({ where: { isDemo: true } });
  await prisma.client.deleteMany({ where: { isDemo: true } });
  await prisma.business.deleteMany({ where: { isDemo: true } });
  await prisma.milestoneAchievement.deleteMany({});
  await prisma.businessSettings.update({ where: { id: "default" }, data: { demoDataSeeded: false } });

  revalidatePath("/admin");
  revalidatePath("/admin/goal");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/businesses");
  revalidatePath("/admin/appointments");
  revalidatePath("/admin/pipeline");
  revalidatePath("/admin/outreach");
  revalidatePath("/admin/revenue");
  revalidatePath("/admin/expenses");
  revalidatePath("/admin/mileage");
  revalidatePath("/admin/invoices");
  revalidatePath("/admin/analytics");
  revalidatePath("/admin/settings");
  return { success: true };
}
