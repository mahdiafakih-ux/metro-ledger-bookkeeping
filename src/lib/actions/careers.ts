"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { z } from "zod";

const ApplicationSchema = z.object({
  firstName: z.string().min(1, "Required").max(50),
  lastName: z.string().min(1, "Required").max(50),
  email: z.string().email("Invalid email").max(255),
  phone: z.string().min(7, "Required").max(30),
  city: z.string().min(1, "Required").max(100),
  state: z.string().min(2, "Required").max(50),
  roleInterest: z.string().min(1, "Required").max(100),
  isCommissionedNotary: z.boolean(),
  commissionState: z.string().max(50).default(""),
  commissionExpiry: z.string().max(20).default(""),
  mobileExperience: z.boolean().default(false),
  ronExperience: z.boolean().default(false),
  signingAgentExperience: z.boolean().default(false),
  availability: z.string().max(500).default(""),
  linkedinUrl: z.string().max(500).default(""),
  message: z.string().max(2000).default(""),
});

export type ApplicationInput = z.infer<typeof ApplicationSchema>;

export async function submitCareerApplication(
  _prev: { success: boolean; error?: string } | null,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const raw: Record<string, unknown> = {};
  for (const key of [
    "firstName",
    "lastName",
    "email",
    "phone",
    "city",
    "state",
    "roleInterest",
    "commissionState",
    "commissionExpiry",
    "availability",
    "linkedinUrl",
    "message",
  ]) {
    raw[key] = formData.get(key) ?? "";
  }
  raw.isCommissionedNotary = formData.get("isCommissionedNotary") === "true";
  raw.mobileExperience = formData.get("mobileExperience") === "true";
  raw.ronExperience = formData.get("ronExperience") === "true";
  raw.signingAgentExperience = formData.get("signingAgentExperience") === "true";

  const result = ApplicationSchema.safeParse(raw);
  if (!result.success) {
    const first = result.error.errors[0];
    return { success: false, error: first?.message ?? "Please check your entries and try again." };
  }

  try {
    await prisma.careerApplication.create({ data: result.data });
    revalidatePath("/admin/careers");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function updateCareerApplicationStatus(id: string, status: string) {
  const valid = ["new", "reviewing", "interview", "approved", "rejected"];
  if (!valid.includes(status)) throw new Error("Invalid status");
  await prisma.careerApplication.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/admin/careers");
  revalidatePath(`/admin/careers/${id}`);
}

export async function getCareerApplications(status?: string) {
  return prisma.careerApplication.findMany({
    where: status && status !== "all" ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function getCareerApplicationById(id: string) {
  return prisma.careerApplication.findUnique({ where: { id } });
}
