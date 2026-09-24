"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";

// Admin-only notary management. Every action verifies an ADMIN session.

const notarySchema = z.object({
  displayName: z.string().trim().min(2, "Display name is required (e.g. “Sarah M.”)").max(60),
  fullName: z.string().trim().max(200).default(""),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]).default(""),
  phone: z.string().trim().max(30).default(""),
  photoUrl: z
    .union([z.literal(""), z.string().trim().url().max(500).refine((u) => u.startsWith("https://"), "Photo URL must start with https://")])
    .default(""),
});

export type NotaryInput = z.input<typeof notarySchema>;

function revalidateAll() {
  revalidatePath("/admin/notaries");
  revalidatePath("/admin/appointments");
  revalidatePath("/portal", "layout");
}

export async function createNotary(input: NotaryInput) {
  const session = await requireAdminSession();
  if (!session) return { success: false as const, error: "Unauthorized" };
  const parsed = notarySchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const notary = await prisma.notary.create({ data: parsed.data });
  revalidateAll();
  return { success: true as const, id: notary.id };
}

export async function updateNotary(id: string, input: NotaryInput) {
  const session = await requireAdminSession();
  if (!session) return { success: false as const, error: "Unauthorized" };
  const parsed = notarySchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await prisma.notary.update({ where: { id }, data: parsed.data });
  revalidateAll();
  return { success: true as const };
}

/**
 * Deactivate instead of delete: history (assigned appointments, client
 * preferences) is preserved, but the notary can't be newly requested or
 * assigned and is hidden from client choices.
 */
export async function setNotaryActive(id: string, isActive: boolean) {
  const session = await requireAdminSession();
  if (!session) return { success: false as const, error: "Unauthorized" };
  await prisma.notary.update({ where: { id }, data: { isActive } });
  revalidateAll();
  return { success: true as const };
}

export async function assignNotaryToAppointment(appointmentId: string, notaryId: string | null) {
  const session = await requireAdminSession();
  if (!session) return { success: false as const, error: "Unauthorized" };

  if (notaryId) {
    const notary = await prisma.notary.findUnique({ where: { id: notaryId } });
    if (!notary) return { success: false as const, error: "Notary not found" };
    if (!notary.isActive) return { success: false as const, error: "That notary is inactive. Reactivate them first." };
  }
  await prisma.appointment.update({ where: { id: appointmentId }, data: { assignedNotaryId: notaryId } });

  revalidatePath(`/admin/appointments/${appointmentId}`);
  revalidatePath("/admin/calendar");
  revalidateAll();
  return { success: true as const };
}
