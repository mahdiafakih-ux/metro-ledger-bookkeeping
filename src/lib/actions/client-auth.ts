"use server";

import { clearClientSessionCookie } from "@/lib/client-auth";

export async function logoutClient() {
  await clearClientSessionCookie();
}
