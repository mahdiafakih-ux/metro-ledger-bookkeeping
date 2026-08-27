"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { dollarsToCents } from "@/lib/money";
import { requireAdminSession } from "@/lib/auth";

export interface BusinessInfoInput {
  businessName: string;
  phone: string;
  email: string;
  serviceArea: string;
  addressLine: string;
  facebookUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  googleBusinessUrl: string;
}

export async function saveBusinessInfo(input: BusinessInfoInput) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  await prisma.businessSettings.update({ where: { id: "default" }, data: input });
  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/contact");
  return { success: true };
}

export interface HomepageWordingInput {
  heroHeadline: string;
  heroSubheadline: string;
}

export async function saveHomepageWording(input: HomepageWordingInput) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  await prisma.businessSettings.update({ where: { id: "default" }, data: input });
  revalidatePath("/admin/settings");
  revalidatePath("/");
  return { success: true };
}

export interface GoalSettingsInput {
  goalAmountDollars: number;
  goalDeadline: string;
}

export async function saveGoalSettings(input: GoalSettingsInput) {
  const session = await requireAdminSession();
  if (!session) return { success: false, error: "Unauthorized" };

  await prisma.businessSettings.update({
    where: { id: "default" },
    data: { goalAmountCents: dollarsToCents(input.goalAmountDollars), goalDeadline: new Date(input.goalDeadline) },
  });
  revalidatePath("/admin/settings");
  revalidatePath("/admin/goal");
  revalidatePath("/admin");
  return { success: true };
}
