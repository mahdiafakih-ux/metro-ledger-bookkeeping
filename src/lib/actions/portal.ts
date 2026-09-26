"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getClientSession, setClientSessionCookie } from "@/lib/client-auth";
import {
  MAX_PREFERRED_NOTARIES,
  appointmentScope,
  getPortalAccount,
  isSubscriptionKind,
  preferenceOwner,
  type PortalAccount,
} from "@/lib/portal/account";
import { getOpenSlotsForDate, type SlotOption } from "@/lib/availability";
import { detroitDateTimeToUtc, formatDetroitDateTime, parseDateISO } from "@/lib/tz";
import { generateConfirmationNumber } from "@/lib/utils";
import { createNotification } from "@/lib/actions/notifications";
import { rateLimit } from "@/lib/rate-limit";
import { SERVICE_TYPES } from "@/lib/constants";
import { PREFERENCE_DISCLAIMER } from "@/lib/portal/constants";

// Every action here re-derives the account from the signed session cookie.
// Nothing about identity, business membership, pricing, or notary eligibility
// is ever taken from the browser.

type ActionResult<T = object> = ({ success: true } & T) | { success: false; error: string };

async function requireAccount(): Promise<PortalAccount | null> {
  const session = await getClientSession();
  if (!session) return null;
  return getPortalAccount();
}

// ---------------------------------------------------------------------------
// Slots
// ---------------------------------------------------------------------------

export async function getPortalSlots(dateISO: string): Promise<SlotOption[]> {
  const session = await getClientSession();
  if (!session) return [];
  if (!parseDateISO(dateISO)) return [];
  return getOpenSlotsForDate(dateISO);
}

// ---------------------------------------------------------------------------
// Notary eligibility
// ---------------------------------------------------------------------------

/**
 * Notaries this account may request: its preferred list, plus any active
 * notary who completed one of its appointments ("request again").
 */
async function eligibleNotaryIds(account: PortalAccount): Promise<Set<string>> {
  const [prefs, history] = await Promise.all([
    prisma.preferredNotary.findMany({
      where: { ...preferenceOwner(account), notary: { isActive: true } },
      select: { notaryId: true },
    }),
    prisma.appointment.findMany({
      where: {
        AND: [appointmentScope(account), { status: "completed", assignedNotaryId: { not: null } }],
        assignedNotary: { isActive: true },
      },
      select: { assignedNotaryId: true },
      distinct: ["assignedNotaryId"],
    }),
  ]);
  return new Set([
    ...prefs.map((p) => p.notaryId),
    ...history.map((h) => h.assignedNotaryId!).filter(Boolean),
  ]);
}

// ---------------------------------------------------------------------------
// Request a Notary
// ---------------------------------------------------------------------------

const requestSchema = z
  .object({
    appointmentType: z.enum(["in_person", "remote"]),
    serviceType: z.enum(SERVICE_TYPES),
    documentType: z.string().trim().min(1, "Tell us what document(s) need notarizing").max(200),
    numberOfActs: z.coerce.number().int().min(1).max(20),
    date: z.string().min(1, "Choose a date"),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Choose a time"),
    address: z.string().trim().max(500).optional().default(""),
    phone: z.string().trim().max(30).optional().default(""),
    notes: z.string().trim().max(2000).optional().default(""),
    notaryPreference: z.enum(["first_available", "preferred", "no_preference"]),
    preferredNotaryId: z.string().max(64).optional().default(""),
  })
  .refine((d) => d.appointmentType === "remote" || d.address.length >= 5, {
    message: "Enter the address where the notary should meet you",
    path: ["address"],
  })
  .refine((d) => d.notaryPreference !== "preferred" || d.preferredNotaryId.length > 0, {
    message: "Choose which preferred notary you'd like",
    path: ["preferredNotaryId"],
  });

export type PortalRequestInput = z.input<typeof requestSchema>;

const SLOT_TAKEN = "That time was just taken. Please choose another time.";

export async function submitPortalRequest(
  input: PortalRequestInput
): Promise<ActionResult<{ appointmentId: string; confirmationNumber: string }>> {
  const account = await requireAccount();
  if (!account) return { success: false, error: "Your session has expired. Please sign in again." };
  if (!account.canRequest) {
    return { success: false, error: "Your account has view-only access. Ask your account owner to request notaries." };
  }

  const { allowed } = rateLimit(`portal-request:${account.client.id}`, 20, 60 * 60 * 1000);
  if (!allowed) return { success: false, error: "Too many requests. Please try again shortly or contact us." };

  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Please check your details." };
  const data = parsed.data;

  const start = detroitDateTimeToUtc(data.date, data.time);
  if (!start) return { success: false, error: "Please choose a valid date and time." };

  let preferredNotaryId: string | null = null;
  let preferredNotaryName = "";
  if (data.notaryPreference === "preferred") {
    const eligible = await eligibleNotaryIds(account);
    if (!eligible.has(data.preferredNotaryId)) {
      return { success: false, error: "That notary isn't available to request from your account." };
    }
    const notary = await prisma.notary.findFirst({ where: { id: data.preferredNotaryId, isActive: true } });
    if (!notary) return { success: false, error: "That notary is no longer available. Please choose another option." };
    preferredNotaryId = notary.id;
    preferredNotaryName = notary.displayName;
  }

  // Pricing — from the admin-editable PricingPlan rows, never from the browser.
  //
  // • Pay-as-you-go: identical to public booking (statutory fee per act from the
  //   "individual" plan + that plan's separately-disclosed service fee).
  // • Business10 / Business30 (or a legacy Unlimited subscription): submitted under the subscription. We do NOT
  //   assume a per-appointment charge or a number of notarial acts: statutory
  //   and service amounts start at $0 and the actual statutory notarial-act
  //   fees (if any are charged) are recorded separately on the appointment by
  //   Notar-E after the appointment, based on the acts actually performed.
  const underSubscription =
    isSubscriptionKind(account.plan.kind) &&
    ["", "active", "past_due", "trialing"].includes(account.plan.status);

  let statutoryFeeCents = 0;
  let serviceFeeCents = 0;
  if (!underSubscription) {
    const individual = await prisma.pricingPlan.findUnique({ where: { key: "individual" } });
    if (!individual) return { success: false, error: "Online requests are temporarily unavailable. Please contact us." };
    statutoryFeeCents = data.numberOfActs * individual.statutoryFeeCents;
    serviceFeeCents = individual.serviceFeeCents;
  }
  const totalCents = statutoryFeeCents + serviceFeeCents;

  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  const duration = settings?.appointmentDurationMinutes ?? 20;
  const end = new Date(start.getTime() + duration * 60000);
  const confirmationNumber = generateConfirmationNumber();

  const client = await prisma.client.findUnique({ where: { id: account.client.id } });
  if (!client) return { success: false, error: "Account not found." };
  const phone = data.phone || client.phone;

  const billingLine = underSubscription
    ? `Billing: submitted under ${account.plan.name} subscription. Statutory notarial-act fees, if applicable, to be recorded separately after the appointment.`
    : "";
  const notes = [data.notes, billingLine].filter(Boolean).join("\n\n");

  let appointmentId: string | null = null;
  // Same concurrency protection as public booking: availability re-check +
  // insert in one Serializable transaction, one retry on serialization failure.
  for (let attempt = 0; attempt < 2 && !appointmentId; attempt++) {
    try {
      appointmentId = await prisma.$transaction(
        async (tx) => {
          const open = await getOpenSlotsForDate(data.date, tx);
          if (!open.some((s) => s.value === data.time)) throw new Error(SLOT_TAKEN);

          const appt = await tx.appointment.create({
            data: {
              confirmationNumber,
              type: data.appointmentType,
              status: "scheduled",
              paymentStatus: "unpaid",
              paymentMethod: underSubscription ? "invoice" : "",
              clientId: client.id,
              businessId: account.plan.owner === "business" && account.business ? account.business.id : null,
              clientName: client.name,
              company: account.business?.companyName || client.company,
              email: client.email,
              phone,
              address: data.appointmentType === "remote" ? "" : data.address,
              serviceType: data.serviceType,
              documentType: data.documentType,
              numberOfActs: data.numberOfActs,
              statutoryFeeCents,
              otherFeesCents: serviceFeeCents,
              totalAmountCents: totalCents,
              scheduledStart: start,
              scheduledEnd: end,
              notes,
              source: "client_portal",
              notaryPreference: data.notaryPreference,
              preferredNotaryId,
            },
          });

          await tx.client.update({
            where: { id: client.id },
            data: {
              lastAppointmentDate: start,
              firstAppointmentDate: client.firstAppointmentDate ?? start,
              totalAppointments: { increment: 1 },
              ...(data.phone && !client.phone ? { phone: data.phone } : {}),
            },
          });
          return appt.id;
        },
        { isolationLevel: "Serializable" }
      );
    } catch (err) {
      if (err instanceof Error && err.message === SLOT_TAKEN) return { success: false, error: SLOT_TAKEN };
      const code = typeof err === "object" && err && "code" in err ? (err as { code?: string }).code : undefined;
      if ((code !== "P2034" && code !== "40001") || attempt === 1) {
        console.error("Portal request failed:", err);
        return { success: false, error: "Something went wrong. Please try again." };
      }
    }
  }
  if (!appointmentId) return { success: false, error: SLOT_TAKEN };

  const when = formatDetroitDateTime(start, { year: undefined });
  await createNotification({
    type: "new_booking",
    title: "New portal request",
    body: `${account.displayName} requested ${data.serviceType} for ${when}${preferredNotaryName ? ` · prefers ${preferredNotaryName}` : ""}`,
    link: `/admin/appointments/${appointmentId}`,
  });

  try {
    const { sendBookingConfirmationEmail, sendBookingNotificationEmail } = await import("@/lib/email");
    await sendBookingConfirmationEmail({
      to: client.email,
      name: client.name,
      appointmentId,
      confirmationNumber,
      serviceType: data.serviceType,
      type: data.appointmentType,
      scheduledStart: start,
      totalCents,
      billingNote: underSubscription ? `Included with your ${account.plan.name} plan` : undefined,
      extraNote: preferredNotaryName ? `You requested ${preferredNotaryName.replace(/\.$/, "")}. ${PREFERENCE_DISCLAIMER}` : undefined,
    });
    await sendBookingNotificationEmail({
      appointmentId,
      confirmationNumber,
      name: client.name,
      email: client.email,
      phone,
      serviceType: data.serviceType,
      type: data.appointmentType,
      scheduledStart: start,
      address: data.address,
      notes: [notes, preferredNotaryName ? `Preferred notary: ${preferredNotaryName}` : ""].filter(Boolean).join("\n"),
    });
  } catch (err) {
    // The appointment is committed; email problems never fail the request.
    console.error("Portal request email failed:", err instanceof Error ? err.message : err);
  }

  revalidatePath("/portal", "layout");
  revalidatePath("/admin/appointments");
  revalidatePath("/admin/calendar");
  return { success: true, appointmentId, confirmationNumber };
}

// ---------------------------------------------------------------------------
// Preferred notaries
// ---------------------------------------------------------------------------

export async function addPreferredNotary(notaryId: string): Promise<ActionResult> {
  const account = await requireAccount();
  if (!account) return { success: false, error: "Please sign in again." };
  if (!account.canRequest) return { success: false, error: "Your account has view-only access." };
  if (typeof notaryId !== "string" || notaryId.length > 64) return { success: false, error: "Invalid notary." };

  // Only notaries who actually completed an appointment for this account.
  const worked = await prisma.appointment.findFirst({
    where: { AND: [appointmentScope(account), { status: "completed", assignedNotaryId: notaryId }] },
    select: { id: true },
  });
  if (!worked) return { success: false, error: "You can add a notary after they've completed an appointment for you." };

  const notary = await prisma.notary.findFirst({ where: { id: notaryId, isActive: true } });
  if (!notary) return { success: false, error: "That notary is no longer available." };

  const owner = preferenceOwner(account);
  try {
    await prisma.$transaction(
      async (tx) => {
        const existing = await tx.preferredNotary.findMany({ where: owner });
        if (existing.some((p) => p.notaryId === notaryId)) return;
        if (existing.length >= MAX_PREFERRED_NOTARIES) throw new Error("LIMIT");
        await tx.preferredNotary.create({
          data: { ...owner, notaryId, isPrimary: !existing.some((p) => p.isPrimary) },
        });
      },
      { isolationLevel: "Serializable" }
    );
  } catch (err) {
    if (err instanceof Error && err.message === "LIMIT") {
      return {
        success: false,
        error: `You can keep up to ${MAX_PREFERRED_NOTARIES} preferred notaries. Remove one to add ${notary.displayName}.`,
      };
    }
    console.error("addPreferredNotary failed:", err);
    return { success: false, error: "Couldn't save your preference. Please try again." };
  }

  revalidatePath("/portal", "layout");
  return { success: true };
}

export async function removePreferredNotary(preferenceId: string): Promise<ActionResult> {
  const account = await requireAccount();
  if (!account) return { success: false, error: "Please sign in again." };
  if (!account.canRequest) return { success: false, error: "Your account has view-only access." };

  const owner = preferenceOwner(account);
  await prisma.$transaction(
    async (tx) => {
      const pref = await tx.preferredNotary.findFirst({ where: { id: preferenceId, ...owner } });
      if (!pref) return;
      await tx.preferredNotary.delete({ where: { id: pref.id } });
      if (pref.isPrimary) {
        const next = await tx.preferredNotary.findFirst({ where: owner, orderBy: { createdAt: "asc" } });
        if (next) await tx.preferredNotary.update({ where: { id: next.id }, data: { isPrimary: true } });
      }
    },
    { isolationLevel: "Serializable" }
  );

  revalidatePath("/portal", "layout");
  return { success: true };
}

export async function setPrimaryPreferredNotary(preferenceId: string): Promise<ActionResult> {
  const account = await requireAccount();
  if (!account) return { success: false, error: "Please sign in again." };
  if (!account.canRequest) return { success: false, error: "Your account has view-only access." };

  const owner = preferenceOwner(account);
  const ok = await prisma.$transaction(
    async (tx) => {
      const pref = await tx.preferredNotary.findFirst({ where: { id: preferenceId, ...owner } });
      if (!pref) return false;
      await tx.preferredNotary.updateMany({ where: { ...owner, isPrimary: true }, data: { isPrimary: false } });
      await tx.preferredNotary.update({ where: { id: pref.id }, data: { isPrimary: true } });
      return true;
    },
    { isolationLevel: "Serializable" }
  );
  if (!ok) return { success: false, error: "Preference not found." };

  revalidatePath("/portal", "layout");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

const profileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(200),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => v === "" || /^[\d\s()+.\-x]{7,30}$/i.test(v), "Please enter a valid phone number"),
  company: z.string().trim().max(200),
});

export async function updatePortalProfile(input: z.input<typeof profileSchema>): Promise<ActionResult> {
  const session = await getClientSession();
  if (!session) return { success: false, error: "Please sign in again." };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Please check your details." };

  // Email is the sign-in identity and is intentionally NOT editable here.
  const updated = await prisma.client.update({
    where: { id: session.clientId },
    data: { name: parsed.data.name, phone: parsed.data.phone, company: parsed.data.company },
  });
  await setClientSessionCookie({ clientId: updated.id, email: updated.email, name: updated.name });

  revalidatePath("/portal", "layout");
  return { success: true };
}
