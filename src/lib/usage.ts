import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { SUBSCRIPTION_PLANS, allocateOverage, isSubscriptionPlanKey } from "@/lib/plans";

/**
 * Business subscription usage — the single ledger sync (COUNTING ONLY).
 *
 * Merged design:
 *  - portal-redesign: recount a business's whole Stripe billing period from its
 *    appointments (idempotent sweep; callers pass every business an edit may
 *    have touched, e.g. both the old and new business when reassigned).
 *  - Business10/Business30: usage is measured in NOTARIZATIONS (notarial acts,
 *    Appointment.numberOfActs), each row keeps the plan + rate it was recorded
 *    under (so a mid-month plan switch never re-prices past usage), and rows
 *    already invoiced are locked.
 *
 * A qualifying appointment is linked to the business, `completed`, and its
 * scheduled start falls inside the business's current Stripe billing period.
 *
 * It NEVER creates invoices or charges. Overage is only billed when an admin
 * explicitly creates a (draft) overage invoice from the business page.
 *
 * Legacy Business Unlimited subscriptions are still counted (for display) but
 * never accrue overage.
 */
export async function syncBusinessUsage(businessId: string | null | undefined): Promise<void> {
  if (!businessId) return;

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return;

  const planKey = business.currentPlanKey || business.packageKey;
  const metered = isSubscriptionPlanKey(planKey) || planKey === "unlimited";
  if (!metered) return;
  // The ledger is keyed to a real Stripe billing period.
  if (!business.currentPeriodStart || !business.currentPeriodEnd || !business.stripeSubscriptionId) return;
  if (business.subscriptionStatus === "canceled") return;

  const periodStart = business.currentPeriodStart;
  const periodEnd = business.currentPeriodEnd;
  const currentPlan = isSubscriptionPlanKey(planKey) ? SUBSCRIPTION_PLANS[planKey] : null;

  await runSerializable(async (tx) => {
    const qualifying = await tx.appointment.findMany({
      where: { businessId, status: "completed", scheduledStart: { gte: periodStart, lt: periodEnd } },
      select: { id: true, numberOfActs: true },
      orderBy: [{ scheduledStart: "asc" }, { id: "asc" }],
    });
    const unitsById = new Map(qualifying.map((a) => [a.id, Math.max(1, a.numberOfActs || 1)]));

    const existing = await tx.businessUsage.findMany({
      where: { businessId, billingPeriodStart: periodStart, billingPeriodEnd: periodEnd },
    });

    // Remove rows that no longer qualify — never anything already invoiced.
    const stale = existing.filter((u) => !unitsById.has(u.appointmentId) && u.billingStatus !== "invoiced");
    if (stale.length) await tx.businessUsage.deleteMany({ where: { id: { in: stale.map((u) => u.id) } } });

    // Number of acts edited on a not-yet-invoiced appointment.
    for (const u of existing) {
      const units = unitsById.get(u.appointmentId);
      if (units !== undefined && u.billingStatus !== "invoiced" && u.units !== units) {
        await tx.businessUsage.update({ where: { id: u.id }, data: { units } });
      }
    }

    // New qualifying appointments are recorded under the plan in force now.
    const existingIds = new Set(existing.map((u) => u.appointmentId));
    const missing = qualifying.filter((a) => !existingIds.has(a.id));
    if (missing.length) {
      await tx.businessUsage.createMany({
        data: missing.map((a) => ({
          businessId,
          appointmentId: a.id,
          stripeSubscriptionId: business.stripeSubscriptionId,
          billingPeriodStart: periodStart,
          billingPeriodEnd: periodEnd,
          units: unitsById.get(a.id) ?? 1,
          planKey,
          overageUnitCents: currentPlan?.overagePerNotarizationCents ?? 0,
        })),
        skipDuplicates: true, // appointmentId is UNIQUE — a row may exist for another period
      });
    }

    // Allocate overage chronologically (by appointment time), per-row plan terms.
    const rows = await tx.businessUsage.findMany({
      where: { businessId, billingPeriodStart: periodStart, billingPeriodEnd: periodEnd },
    });
    const order = new Map(qualifying.map((a, i) => [a.id, i]));
    rows.sort((a, b) => (order.get(a.appointmentId) ?? -1) - (order.get(b.appointmentId) ?? -1) || a.createdAt.getTime() - b.createdAt.getTime());
    const allowanceOf = (key: string) => (isSubscriptionPlanKey(key) ? SUBSCRIPTION_PLANS[key].includedNotarizations : Number.POSITIVE_INFINITY);
    const allocation = allocateOverage(
      rows.map((r) => ({
        id: r.id,
        units: r.units,
        included: allowanceOf(r.planKey || planKey),
        locked: r.billingStatus === "invoiced",
        lockedOverageUnits: r.overageUnits,
      })),
      allowanceOf(planKey)
    );
    for (const r of rows) {
      const units = allocation.get(r.id);
      if (units === undefined) continue; // invoiced — locked
      const rowKey = r.planKey || planKey;
      const rate = r.overageUnitCents > 0 ? r.overageUnitCents : isSubscriptionPlanKey(rowKey) ? SUBSCRIPTION_PLANS[rowKey].overagePerNotarizationCents : 0;
      const cents = units * rate;
      if (r.overageUnits !== units || r.overageAmountCents !== cents || r.isOverage !== units > 0) {
        await tx.businessUsage.update({
          where: { id: r.id },
          data: { overageUnits: units, isOverage: units > 0, overageAmountCents: cents, overageUnitCents: rate },
        });
      }
    }

    await tx.business.update({
      where: { id: businessId },
      data: { monthlyUsageCount: rows.reduce((s, r) => s + r.units, 0) },
    });
  });
}

/** Best-effort wrapper for use after admin mutations — never blocks the caller. */
export async function syncBusinessUsageSafe(...businessIds: (string | null | undefined)[]) {
  for (const id of new Set(businessIds.filter(Boolean))) {
    try {
      await syncBusinessUsage(id);
    } catch (err) {
      console.error("Business usage sync failed:", id, err instanceof Error ? err.message : err);
    }
  }
}

type Tx = Prisma.TransactionClient;

/** Retry Postgres serialization failures a few times before giving up. */
export async function runSerializable<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(fn, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (attempt < 3 && (code === "P2034" || code === "40001")) continue;
      throw error;
    }
  }
}
