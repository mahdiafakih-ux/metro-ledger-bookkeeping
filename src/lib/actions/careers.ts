"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { APPLICATION_STATUSES, CAREER_ROLE_KEYS } from "@/lib/careers";

type Result = { success: true } | { success: false; error: string };

function refresh(id?: string) {
  revalidatePath("/admin/careers");
  if (id) revalidatePath(`/admin/careers/${id}`);
}

export async function updateApplicationStatus(id: string, status: string): Promise<Result> {
  if (!(await requireAdminSession())) return { success: false, error: "Unauthorized" };
  if (!(APPLICATION_STATUSES as readonly string[]).includes(status)) return { success: false, error: "Invalid status" };
  await prisma.careerApplication.update({ where: { id }, data: { status } });
  refresh(id);
  return { success: true };
}

export async function updateApplicationNotes(id: string, notes: string): Promise<Result> {
  if (!(await requireAdminSession())) return { success: false, error: "Unauthorized" };
  await prisma.careerApplication.update({ where: { id }, data: { adminNotes: String(notes).slice(0, 5000) } });
  refresh(id);
  return { success: true };
}

/** Permanently delete an application and its resume (e.g. a privacy request). */
export async function deleteApplication(id: string): Promise<Result> {
  if (!(await requireAdminSession())) return { success: false, error: "Unauthorized" };
  await prisma.careerApplication.delete({ where: { id } });
  refresh();
  return { success: true };
}

const openingSchema = z.object({
  title: z.string().trim().min(3, "Title is required").max(120),
  roleKey: z.enum(CAREER_ROLE_KEYS),
  location: z.string().trim().min(2).max(120),
  employment: z.enum(["Contract", "Part-time", "Full-time"]),
  summary: z.string().trim().max(600).optional().default(""),
});

export async function createJobOpening(input: z.input<typeof openingSchema>): Promise<Result> {
  if (!(await requireAdminSession())) return { success: false, error: "Unauthorized" };
  const parsed = openingSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid opening" };
  await prisma.jobOpening.create({ data: parsed.data });
  refresh();
  revalidatePath("/careers");
  return { success: true };
}

export async function setJobOpeningActive(id: string, isActive: boolean): Promise<Result> {
  if (!(await requireAdminSession())) return { success: false, error: "Unauthorized" };
  await prisma.jobOpening.update({ where: { id }, data: { isActive } });
  refresh();
  revalidatePath("/careers");
  return { success: true };
}

export async function deleteJobOpening(id: string): Promise<Result> {
  if (!(await requireAdminSession())) return { success: false, error: "Unauthorized" };
  await prisma.jobOpening.delete({ where: { id } }); // applications keep their data (FK set null)
  refresh();
  revalidatePath("/careers");
  return { success: true };
}
