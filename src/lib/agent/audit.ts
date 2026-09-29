// Durable audit log for AI operator write actions (AgentActionLog), with a
// structured console fallback. Never records the API key or raw payloads.
// Best-effort: an audit write failure is logged but never masks the result
// of an action that already happened.

import { prisma } from "@/lib/db";

export interface AgentAuditEntry {
  action: string;
  targetType: string;
  targetId: string;
  summary: string;
  success: boolean;
  error?: string;
}

const clip = (s: string, max: number) => (s.length > max ? s.slice(0, max) : s);

export async function recordAgentAction(entry: AgentAuditEntry): Promise<void> {
  const row = {
    action: clip(entry.action, 64),
    targetType: clip(entry.targetType, 32),
    targetId: clip(entry.targetId, 64),
    summary: clip(entry.summary, 500),
    success: entry.success,
    error: clip(entry.error ?? "", 300),
  };

  console.info(JSON.stringify({ event: "agent_action", ...row }));

  try {
    await prisma.agentActionLog.create({ data: row });
  } catch (err) {
    // Most likely the migration hasn't been applied yet.
    console.error("AgentActionLog write failed:", err instanceof Error ? err.message.slice(0, 200) : err);
  }
}
