import { signSessionToken, verifySessionTokenOfType } from "./session-tokens";
import { cookies } from "next/headers";

const PORTAL_COOKIE_NAME = "notare_client_portal";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type ClientSessionPayload = {
  clientId: string;
  email: string;
  name: string;
};

/**
 * Create a JWT token for client portal access
 */
export async function createClientSessionToken(payload: ClientSessionPayload) {
  return signSessionToken(
    "client",
    payload.clientId,
    { clientId: payload.clientId, email: payload.email, name: payload.name },
    SESSION_DURATION_SECONDS
  );
}

/**
 * Verify client portal JWT token
 */
// Only accepts tokens minted for the CLIENT audience with typ "client".
// An admin token is never accepted as a client-portal session.
export async function verifyClientSessionToken(token: string): Promise<ClientSessionPayload | null> {
  const payload = await verifySessionTokenOfType("client", token);
  if (!payload) return null;
  return {
    clientId: String(payload.sub),
    email: String(payload.email ?? ""),
    name: String(payload.name ?? ""),
  };
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
 * Generate a 6-digit one-time access code using a CSPRNG.
 */
export function generateAccessCode(): string {
  // crypto.getRandomValues is available in Node 20+ and the Edge runtime.
  const buf = new Uint32Array(1);
  let n: number;
  // Rejection sampling keeps the distribution uniform over 000000–999999.
  do {
    crypto.getRandomValues(buf);
    n = buf[0];
  } while (n >= 4_294_000_000);
  return String(n % 1_000_000).padStart(6, "0");
}

// One-time login code policy. Enforced server-side and persisted in the
// database (ClientAccessSession.failedAttempts) so it holds across
// serverless instances, unlike the in-memory limiter.
export const ACCESS_CODE_TTL_MINUTES = 10;
export const ACCESS_CODE_MAX_ATTEMPTS = 5;

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
