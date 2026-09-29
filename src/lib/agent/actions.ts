// Executes a validated operator action with narrowly scoped writes. Each
// branch touches only the one field it is allowed to change.

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { applyAppointmentStatus } from "@/lib/appointment-status";
import { dateOnlyToUtc, detroitTodayISO, formatDetroitDateTime } from "@/lib/tz";
import { appendNote, type AgentTargetType, type ValidatedAction } from "@/lib/agent/action-rules";

/** Stored notes are capped so repeated appends can't grow a row without bound. */
export const MAX_STORED_NOTES_CHARS = 20_000;

export interface AgentTarget {
  type: AgentTargetType;
  id: string;
  label: string;
  notes: string;
  followUpDate: Date | null;
  status?: string;
}

/** Look up a non-demo target. Appointments also accept a confirmation number. */
export async function findAgentTarget(type: AgentTargetType, targetId: string): Promise<AgentTarget | null> {
  if (type === "appointment") {
    const a = await prisma.appointment.findFirst({
      where: { isDemo: false, OR: [{ id: targetId }, { confirmationNumber: targetId.toUpperCase() }] },
      select: { id: true, confirmationNumber: true, clientName: true, scheduledStart: true, status: true, notes: true, followUpDate: true },
    });
    if (!a) return null;
    return {
      type,
      id: a.id,
      label: `appointment ${a.confirmationNumber} (${a.clientName}, ${formatDetroitDateTime(a.scheduledStart, { weekday: "short" })})`,
      notes: a.notes,
      followUpDate: a.followUpDate,
      status: a.status,
    };
  }
  if (type === "client") {
    const c = await prisma.client.findFirst({
      where: { id: targetId, isDemo: false },
      select: { id: true, name: true, company: true, notes: true, followUpDate: true },
    });
    if (!c) return null;
    return { type, id: c.id, label: `client ${c.name}${c.company ? ` (${c.company})` : ""}`, notes: c.notes, followUpDate: c.followUpDate };
  }
  const b = await prisma.business.findFirst({
    where: { id: targetId, isDemo: false },
    select: { id: true, companyName: true, notes: true, followUpDate: true },
  });
  if (!b) return null;
  return { type, id: b.id, label: `business ${b.companyName}`, notes: b.notes, followUpDate: b.followUpDate };
}

/** What the operator should read back to the owner before confirming. */
export function describePendingAction(target: AgentTarget, payload: ValidatedAction): string {
  switch (payload.kind) {
    case "status":
      return `Change ${target.label} from ${target.status} to ${payload.data.status}?${
        payload.data.status === "cancelled" ? " The customer will be emailed a cancellation notice." : ""
      }`;
    case "notes":
      return `Replace all existing notes on ${target.label} with the new text?`;
    case "follow_up":
      return `Clear the follow-up date on ${target.label}?`;
  }
}

function revalidateTarget(target: AgentTarget) {
  const base = target.type === "appointment" ? "/admin/appointments" : target.type === "client" ? "/admin/clients" : "/admin/businesses";
  revalidatePath(base);
  revalidatePath(`${base}/${target.id}`);
  revalidatePath("/admin");
}

export interface ActionOutcome {
  changed: boolean;
  message: string;
  /** Audit summary — no note text, only its length. */
  summary: string;
  result: Record<string, unknown>;
}

export async function executeAgentAction(target: AgentTarget, payload: ValidatedAction): Promise<ActionOutcome> {
  switch (payload.kind) {
    case "status": {
      const next = payload.data.status;
      if (target.status === next) {
        return {
          changed: false,
          message: `No change: ${target.label} is already ${next}.`,
          summary: `status unchanged (${next})`,
          result: { status: next },
        };
      }
      await applyAppointmentStatus(target.id, next);
      return {
        changed: true,
        message: `Updated ${target.label} to ${next}.`,
        summary: `status ${target.status} -> ${next}`,
        result: { previousStatus: target.status, status: next },
      };
    }

    case "notes": {
      const { notes, mode } = payload.data;
      const updated = mode === "replace" ? notes : appendNote(target.notes, notes, detroitTodayISO());
      if (updated.length > MAX_STORED_NOTES_CHARS) {
        throw new AgentActionError(`Notes would exceed ${MAX_STORED_NOTES_CHARS} characters. Summarize and use mode 'replace'.`, 422);
      }
      if (target.type === "appointment") await prisma.appointment.update({ where: { id: target.id }, data: { notes: updated } });
      else if (target.type === "client") await prisma.client.update({ where: { id: target.id }, data: { notes: updated } });
      else await prisma.business.update({ where: { id: target.id }, data: { notes: updated } });
      revalidateTarget(target);
      return {
        changed: true,
        message: mode === "replace" ? `Replaced notes on ${target.label}.` : `Added a note to ${target.label}.`,
        summary: `notes ${mode} (${notes.length} chars)`,
        result: { mode, notesLength: updated.length },
      };
    }

    case "follow_up": {
      const { date } = payload.data;
      const value = date === null ? null : dateOnlyToUtc(date);
      if (target.type === "appointment") await prisma.appointment.update({ where: { id: target.id }, data: { followUpDate: value } });
      else if (target.type === "client") await prisma.client.update({ where: { id: target.id }, data: { followUpDate: value } });
      else await prisma.business.update({ where: { id: target.id }, data: { followUpDate: value } });
      revalidateTarget(target);
      const previous = target.followUpDate ? target.followUpDate.toISOString().slice(0, 10) : null;
      return {
        changed: previous !== date,
        message: date === null ? `Cleared the follow-up date on ${target.label}.` : `Follow-up for ${target.label} set to ${date}.`,
        summary: `followUpDate ${previous ?? "none"} -> ${date ?? "none"}`,
        result: { previousFollowUpDate: previous, followUpDate: date },
      };
    }
  }
}

export class AgentActionError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}
