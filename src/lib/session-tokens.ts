// Signed session tokens for the two separate login systems (admin and client
// portal). Both are signed with AUTH_SECRET, so each token carries an explicit
// audience + type claim and every verifier checks both — a client-portal token
// can never be accepted as an admin session (or vice versa).
//
// Edge-safe: only depends on `jose`, so it can be imported from src/proxy.ts.
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const ADMIN_AUDIENCE = "notare:admin";
export const CLIENT_AUDIENCE = "notare:client";
const ISSUER = "notare-services";

export type SessionType = "admin" | "client";

const AUDIENCE: Record<SessionType, string> = {
  admin: ADMIN_AUDIENCE,
  client: CLIENT_AUDIENCE,
};

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(
  type: SessionType,
  subject: string,
  claims: Record<string, string>,
  maxAgeSeconds: number
) {
  return new SignJWT({ ...claims, typ: type })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subject)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE[type])
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(getSecretKey());
}

/**
 * Verifies signature, expiry, issuer, audience AND the `typ` claim.
 * Returns null for anything else — including legacy tokens issued before
 * typed sessions existed (those users simply sign in again).
 */
export async function verifySessionTokenOfType(
  type: SessionType,
  token: string | undefined
): Promise<JWTPayload | null> {
  if (!token) return null;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE[type],
    });
    if (payload.typ !== type || typeof payload.sub !== "string" || !payload.sub) return null;
    return payload;
  } catch {
    return null;
  }
}
