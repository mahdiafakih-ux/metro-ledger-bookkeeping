// POST /api/agent/actions — allowlisted, audited write actions for the
// private AI operator. GET lists the allowed actions.
//
// Body: { "action": "...", "targetId": "...", "data": {...}, "confirmed": true|false }
//
// Actions that materially change business state return
//   { success: false, requiresConfirmation: true, confirmationPrompt }
// (HTTP 200, nothing written) until repeated with "confirmed": true.
// There are no delete, payment, Stripe, pricing, auth or settings actions.

import type { NextRequest } from "next/server";
import { requireAgentAuth } from "@/lib/agent/auth";
import { agentError, agentOk } from "@/lib/agent/respond";
import { AGENT_ACTIONS, validateAgentAction } from "@/lib/agent/action-rules";
import { AgentActionError, describePendingAction, executeAgentAction, findAgentTarget } from "@/lib/agent/actions";
import { recordAgentAction } from "@/lib/agent/audit";

const MAX_BODY_BYTES = 10_000;

export async function GET(request: NextRequest) {
  const denied = requireAgentAuth(request);
  if (denied) return denied;
  return agentOk({
    actions: Object.entries(AGENT_ACTIONS).map(([name, def]) => ({ name, targetType: def.targetType, description: def.description })),
  });
}

export async function POST(request: NextRequest) {
  const denied = requireAgentAuth(request, "write");
  if (denied) return denied;

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return agentError("Request body too large.", 413);
    body = JSON.parse(text);
  } catch {
    return agentError("Request body must be valid JSON.", 400);
  }

  const v = validateAgentAction(body);
  if (!v.ok) {
    await recordAgentAction({
      action: v.action && v.error.startsWith("Unsupported action") ? "unsupported" : v.action ?? "invalid",
      targetType: "",
      targetId: "",
      summary: v.action ? `rejected: ${v.action}` : "rejected: malformed request",
      success: false,
      error: v.error,
    });
    return agentError(v.error, v.status);
  }

  try {
    const target = await findAgentTarget(v.targetType, v.targetId);
    if (!target) {
      await recordAgentAction({
        action: v.action,
        targetType: v.targetType,
        targetId: v.targetId,
        summary: "target not found",
        success: false,
        error: "not_found",
      });
      return agentError(`No ${v.targetType} found with id '${v.targetId}'.`, 404);
    }

    if (v.needsConfirmation && !v.confirmed) {
      return agentOk({
        success: false,
        requiresConfirmation: true,
        action: v.action,
        targetId: target.id,
        confirmationPrompt: describePendingAction(target, v.payload),
        error: "Confirmation required. Ask the owner, then resend with confirmed: true.",
      });
    }

    const outcome = await executeAgentAction(target, v.payload);
    await recordAgentAction({
      action: v.action,
      targetType: target.type,
      targetId: target.id,
      summary: outcome.summary,
      success: true,
    });

    return agentOk({
      action: v.action,
      target: { type: target.type, id: target.id, label: target.label },
      changed: outcome.changed,
      message: outcome.message,
      result: outcome.result,
    });
  } catch (error) {
    const known = error instanceof AgentActionError;
    const message = known ? error.message : "The action could not be completed.";
    if (!known) console.error("Agent action error:", error instanceof Error ? error.message : error);
    await recordAgentAction({
      action: v.action,
      targetType: v.targetType,
      targetId: v.targetId,
      summary: "execution failed",
      success: false,
      error: message,
    });
    return agentError(message, known ? error.status : 500);
  }
}
