import { signSessionToken, verifySessionTokenOfType } from "./session-tokens";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const COOKIE_NAME = "notare_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 14; // 14 days

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
};

export async function createSessionToken(payload: SessionPayload) {
  return signSessionToken(
    "admin",
    payload.userId,
    { userId: payload.userId, email: payload.email, name: payload.name },
    SESSION_DURATION_SECONDS
  );
}

// Only accepts tokens minted for the ADMIN audience with typ "admin".
// A client-portal token (same secret, different audience/type) is rejected.
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const payload = await verifySessionTokenOfType("admin", token);
  if (!payload) return null;
  return {
    userId: String(payload.sub),
    email: String(payload.email ?? ""),
    name: String(payload.name ?? ""),
  };
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;

/**
 * Authorization guard for Server Actions that mutate business data.
 *
 * Next.js Server Actions are independently invocable server endpoints —
 * a valid session cookie on the *page* that loaded them is not, by itself,
 * a guarantee the mutation is authorized, since action references can end
 * up in shared client bundles. Every Server Action that writes sensitive
 * data (anything other than the intentionally public booking/lead/payment
 * entry points) must call this first and bail out on `null`.
 */
export async function requireAdminSession(): Promise<SessionPayload | null> {
  return getSession();
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}
