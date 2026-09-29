// Allowlist + validation for POST /api/agent/actions. Pure (no DB access) so
// it can be unit-tested. Anything not listed here is rejected — there is no
// generic "update field" path.

import { z } from "zod";
import { APPOINTMENT_STATUSES } from "@/lib/constants";
import { addDaysISO, detroitTodayISO, parseDateISO } from "@/lib/tz";

export type AgentTargetType = "appointment" | "client" | "business";
type ActionKind = "status" | "notes" | "follow_up";

interface ActionDef {
  targetType: AgentTargetType;
  kind: ActionKind;
  description: string;
}

export const AGENT_ACTIONS = {
  update_appointment_status: {
    targetType: "appointment",
    kind: "status",
    description: "Set status to scheduled, completed, cancelled or no_show. Always requires confirmed: true.",
  },
  update_appointment_notes: {
    targetType: "appointment",
    kind: "notes",
    description: "Append to appointment notes (routine). mode 'replace' overwrites and requires confirmed: true.",
  },
  set_appointment_follow_up: {
    targetType: "appointment",
    kind: "follow_up",
    description: "Set follow-up date (YYYY-MM-DD, today or later). date null clears it and requires confirmed: true.",
  },
  update_client_notes: {
    targetType: "client",
    kind: "notes",
    description: "Append to client notes (routine). mode 'replace' requires confirmed: true.",
  },
  set_client_follow_up: {
    targetType: "client",
    kind: "follow_up",
    description: "Set client follow-up date. date null clears it and requires confirmed: true.",
  },
  update_business_notes: {
    targetType: "business",
    kind: "notes",
    description: "Append to business notes (routine). mode 'replace' requires confirmed: true.",
  },
  set_business_follow_up: {
    targetType: "business",
    kind: "follow_up",
    description: "Set business follow-up date. date null clears it and requires confirmed: true.",
  },
} as const satisfies Record<string, ActionDef>;

export type AgentActionName = keyof typeof AGENT_ACTIONS;

export function isAgentAction(name: unknown): name is AgentActionName {
  return typeof name === "string" && Object.prototype.hasOwnProperty.call(AGENT_ACTIONS, name);
}

export const MAX_NOTE_CHARS = 2000;
export const MAX_FOLLOW_UP_DAYS_AHEAD = 730;

const envelopeSchema = z.object({
  action: z.string().min(1).max(64),
  targetId: z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/, "targetId has invalid characters"),
  data: z.record(z.string(), z.unknown()).optional().default({}),
  confirmed: z.boolean().optional().default(false),
});

const statusData = z.strictObject({ status: z.enum(APPOINTMENT_STATUSES) });
const notesData = z.strictObject({
  notes: z.string().trim().min(1, "notes cannot be empty").max(MAX_NOTE_CHARS, `notes must be ${MAX_NOTE_CHARS} characters or fewer`),
  mode: z.enum(["append", "replace"]).optional().default("append"),
});
const followUpData = z.strictObject({ date: z.union([z.string(), z.null()]) });

export type ValidatedAction =
  | { kind: "status"; data: { status: (typeof APPOINTMENT_STATUSES)[number] } }
  | { kind: "notes"; data: { notes: string; mode: "append" | "replace" } }
  | { kind: "follow_up"; data: { date: string | null } };

export type ValidationResult =
  | {
      ok: true;
      action: AgentActionName;
      targetType: AgentTargetType;
      targetId: string;
      confirmed: boolean;
      needsConfirmation: boolean;
      payload: ValidatedAction;
    }
  | { ok: false; status: number; error: string; action?: string };

function firstIssue(err: z.ZodError) {
  const issue = err.issues[0];
  if (!issue) return "Invalid input";
  const path = issue.path.length ? `${issue.path.join(".")}: ` : "";
  return `${path}${issue.message}`;
}

export function validateAgentAction(body: unknown, now: Date = new Date()): ValidationResult {
  const env = envelopeSchema.safeParse(body);
  if (!env.success) return { ok: false, status: 400, error: firstIssue(env.error) };

  const { action, targetId, data, confirmed } = env.data;
  if (!isAgentAction(action)) {
    return {
      ok: false,
      status: 400,
      action,
      error: `Unsupported action '${action}'. Allowed actions: ${Object.keys(AGENT_ACTIONS).join(", ")}.`,
    };
  }

  const def: ActionDef = AGENT_ACTIONS[action];
  let payload: ValidatedAction;
  let needsConfirmation: boolean;

  switch (def.kind) {
    case "status": {
      const p = statusData.safeParse(data);
      if (!p.success) return { ok: false, status: 400, action, error: firstIssue(p.error) };
      payload = { kind: "status", data: p.data };
      needsConfirmation = true;
      break;
    }
    case "notes": {
      const p = notesData.safeParse(data);
      if (!p.success) return { ok: false, status: 400, action, error: firstIssue(p.error) };
      payload = { kind: "notes", data: p.data };
      needsConfirmation = p.data.mode === "replace";
      break;
    }
    case "follow_up": {
      const p = followUpData.safeParse(data);
      if (!p.success) return { ok: false, status: 400, action, error: firstIssue(p.error) };
      const date = p.data.date;
      if (date !== null) {
        if (!parseDateISO(date)) return { ok: false, status: 400, action, error: "date must be YYYY-MM-DD or null." };
        const today = detroitTodayISO(now);
        if (date < today) return { ok: false, status: 400, action, error: `Follow-up date cannot be in the past (today is ${today}).` };
        if (date > addDaysISO(today, MAX_FOLLOW_UP_DAYS_AHEAD)) {
          return { ok: false, status: 400, action, error: "Follow-up date is too far in the future." };
        }
      }
      payload = { kind: "follow_up", data: { date } };
      needsConfirmation = date === null;
      break;
    }
  }

  return { ok: true, action, targetType: def.targetType, targetId, confirmed, needsConfirmation, payload };
}

/** Append a dated operator note, keeping the existing text intact. */
export function appendNote(existing: string, addition: string, dateLabel: string) {
  const entry = `[${dateLabel} · AI operator] ${addition}`;
  return existing.trim() ? `${existing.trimEnd()}\n\n${entry}` : entry;
}
