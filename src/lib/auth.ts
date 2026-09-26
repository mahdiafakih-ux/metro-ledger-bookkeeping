import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const COOKIE_NAME = "notare_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 14; // 14 days

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

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

/**
 * Admin and client-portal sessions are signed with the same AUTH_SECRET, so
 * every token carries an audience and every check verifies it. Without this
 * a portal (client) token pasted into the admin cookie would pass as admin.
 */
export const ADMIN_TOKEN_AUDIENCE = "notare:admin";

/** True if a verified JWT payload is an admin session (new or pre-audience token). */
export function isAdminTokenPayload(payload: Record<string, unknown>): boolean {
  if ("clientId" in payload) return false; // client-portal token — never admin
  if (typeof payload.userId !== "string" || !payload.userId) return false;
  const aud = payload.aud;
  // Tokens issued before audiences were added have no `aud`; accept those
  // only in the admin shape checked above so existing admin logins survive.
  return aud === undefined || aud === ADMIN_TOKEN_AUDIENCE || (Array.isArray(aud) && aud.includes(ADMIN_TOKEN_AUDIENCE));
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(ADMIN_TOKEN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!isAdminTokenPayload(payload as Record<string, unknown>)) return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
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
