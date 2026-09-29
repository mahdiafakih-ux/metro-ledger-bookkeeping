// Bearer-token auth for the private AI operator API (/api/agent/*).
//
// Server-only: imports node:crypto and reads NOTARE_AGENT_API_KEY, which must
// never reach the browser. Fails closed when the env var is missing or empty.

import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { agentError } from "@/lib/agent/respond";

// Hash both sides so the comparison is constant-time regardless of length.
function digest(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

/** True only when the Authorization header carries exactly the configured key. */
export function isAgentRequestAuthorized(authorizationHeader: string | null, expectedKey: string | undefined): boolean {
  if (!expectedKey) return false;
  if (!authorizationHeader) return false;

  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim());
  if (!match) return false;

  const provided = match[1].trim();
  if (!provided) return false;

  return timingSafeEqual(digest(provided), digest(expectedKey));
}

export type AgentRateBucket = "read" | "write";

const RATE_LIMITS: Record<AgentRateBucket, { limit: number; windowMs: number }> = {
  read: { limit: 120, windowMs: 60_000 },
  write: { limit: 30, windowMs: 60_000 },
};

/**
 * Guard for every /api/agent/* handler. Returns a ready-to-send error response
 * when the request must be rejected, or null when it may proceed.
 */
export function requireAgentAuth(request: NextRequest, bucket: AgentRateBucket = "read") {
  if (!isAgentRequestAuthorized(request.headers.get("authorization"), process.env.NOTARE_AGENT_API_KEY)) {
    return agentError("Unauthorized", 401);
  }

  // Single private caller, so one shared bucket per class is enough. This only
  // limits a runaway tool loop; the key itself is the real access control.
  const { limit, windowMs } = RATE_LIMITS[bucket];
  const { allowed, retryAfterMs } = rateLimit(`agent:${bucket}`, limit, windowMs);
  if (!allowed) {
    const res = agentError("Too many requests. Try again shortly.", 429);
    res.headers.set("Retry-After", String(Math.ceil(retryAfterMs / 1000)));
    return res;
  }

  return null;
}
