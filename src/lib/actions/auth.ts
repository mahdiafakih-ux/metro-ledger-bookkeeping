"use server";

import { prisma } from "@/lib/db";
import { verifyPassword, setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { redirect } from "next/navigation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export interface LoginResult {
  success: boolean;
  error?: string;
}

export async function loginAction(input: { email: string; password: string }): Promise<LoginResult> {
  const ip = await getClientIp();
  const email = input.email.trim().toLowerCase();
  const { allowed } = rateLimit(`login:${ip}:${email}`, 5, 15 * 60 * 1000);
  if (!allowed) return { success: false, error: "Too many attempts. Please wait a few minutes and try again." };

  const user = await prisma.adminUser.findUnique({ where: { email: input.email.trim().toLowerCase() } });
  if (!user) return { success: false, error: "Invalid email or password" };

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) return { success: false, error: "Invalid email or password" };

  await setSessionCookie({ userId: user.id, email: user.email, name: user.name });
  return { success: true };
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/admin/login");
}
