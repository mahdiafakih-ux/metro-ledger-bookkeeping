import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { randomInt } from "node:crypto";

const PORTAL_COOKIE_NAME = "notare_client_portal";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export type ClientSessionPayload = {
  clientId: string;
  email: string;
  name: string;
};

/**
 * Create a JWT token for client portal access
 */
export const CLIENT_TOKEN_AUDIENCE = "notare:client";

export async function createClientSessionToken(payload: ClientSessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(CLIENT_TOKEN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

/**
 * Verify client portal JWT token
 */
export async function verifyClientSessionToken(token: string): Promise<ClientSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    // Reject admin tokens (and anything else) presented as a client session.
    if (typeof payload.clientId !== "string" || !payload.clientId || "userId" in payload) return null;
    if (payload.aud !== undefined && payload.aud !== CLIENT_TOKEN_AUDIENCE) return null;
    return payload as unknown as ClientSessionPayload;
  } catch {
    return null;
  }
}

/**
 * Set client portal session cookie
 */
export async function setClientSessionCookie(payload: ClientSessionPayload) {
  const token = await createClientSessionToken(payload);
  const store = await cookies();
  store.set(PORTAL_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

/**
 * Get client portal session from cookie
 */
export async function getClientSession(): Promise<ClientSessionPayload | null> {
  const store = await cookies();
  const token = store.get(PORTAL_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyClientSessionToken(token);
}

/**
 * Clear client portal session cookie
 */
export async function clearClientSessionCookie() {
  const store = await cookies();
  store.delete(PORTAL_COOKIE_NAME);
}

/**
 * Require client session, return null if not authenticated
 */
export async function requireClientSession(): Promise<ClientSessionPayload | null> {
  return getClientSession();
}

/**
 * Helper to generate a temporary access code (6 digits)
 */
export function generateAccessCode(): string {
  // Cryptographically secure — Math.random() is predictable.
  return randomInt(100000, 1000000).toString();
}

/**
 * Hash an access code with bcryptjs for storage
 */
export async function hashAccessCode(code: string): Promise<string> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(code, 10);
}

/**
 * Verify an access code against a hash
 */
export async function verifyAccessCode(code: string, hash: string): Promise<boolean> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(code, hash);
}
