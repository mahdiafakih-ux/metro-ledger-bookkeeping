import { prisma } from "@/lib/db";
import { getBusinessSettings } from "@/lib/settings";

/**
 * Business subscription usage counting — COUNTING ONLY.
 *
 * A "qualifying" appointment is one linked to the business (businessId) that
 * is `completed` and whose scheduled start falls inside the business's current
 * Stripe billing period.
 *
 * This keeps the BusinessUsage ledger (one row per appointment, unique on
 * appointmentId) and Business.monthlyUsageCount in step with reality, and flags
 * which rows are beyond the plan's included amount (`isOverage`).
 *
 * It NEVER creates invoices, Stripe invoice items, or charges. Rows stay
 * `billingStatus = "unbilled"`; `createOverageInvoice` is intentionally not
 * called anywhere until overage billing rules are reviewed and activated.
 *
 * Idempotent: safe to call after any appointment status/date/business change.
 */
export async function syncBusinessUsage(businessId: string | null | undefined): Promise<void> {
  if (!businessId) return;

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return;

  const planKey = business.currentPlanKey || business.packageKey;
  if (planKey !== "business30" && planKey !== "unlimited") return;
  // The ledger is keyed to a real Stripe billing period; without one there
  // is nothing reliable to attach rows to (the portal still displays usage
  // for the calendar month computed directly from appointments).
  if (!business.currentPeriodStart || !business.currentPeriodEnd || !business.stripeSubscriptionId) return;

  const periodStart = business.currentPeriodStart;
  const periodEnd = business.currentPeriodEnd;

  const [plan, settings] = await Promise.all([
    prisma.pricingPlan.findUnique({ where: { key: planKey } }),
    getBusinessSettings(),
  ]);
  const included =
    planKey === "business30" ? plan?.appointmentsIncluded ?? settings.business30IncludedAppointments : null;
  const overageRate = planKey === "business30" ? plan?.overageFeeCents ?? 0 : 0;

  await prisma.$transaction(
    async (tx) => {
      const qualifying = await tx.appointment.findMany({
        where: {
          businessId,
          status: "completed",
          scheduledStart: { gte: periodStart, lt: periodEnd },
        },
        select: { id: true, scheduledStart: true },
        orderBy: [{ scheduledStart: "asc" }, { id: "asc" }],
      });
      const qualifyingIds = new Set(qualifying.map((a) => a.id));

      const existing = await tx.businessUsage.findMany({
        where: { businessId, billingPeriodStart: periodStart, billingPeriodEnd: periodEnd },
      });

      // Remove rows that no longer qualify — but never touch anything already invoiced.
      const stale = existing.filter((u) => !qualifyingIds.has(u.appointmentId) && u.billingStatus === "unbilled");
      if (stale.length) {
        await tx.businessUsage.deleteMany({ where: { id: { in: stale.map((u) => u.id) } } });
      }

      // Add rows for newly-qualifying appointments (skip ones counted elsewhere).
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
          })),
          skipDuplicates: true,
        });
      }

      // Recompute overage flags in chronological order (unbilled rows only).
      const rows = await tx.businessUsage.findMany({
        where: { businessId, billingPeriodStart: periodStart, billingPeriodEnd: periodEnd },
      });
      const order = new Map(qualifying.map((a, i) => [a.id, i]));
      for (const row of rows) {
        if (row.billingStatus !== "unbilled") continue;
        const idx = order.get(row.appointmentId);
        const isOverage = included != null && idx != null && idx >= included;
        const overageAmountCents = isOverage ? overageRate : 0;
        if (row.isOverage !== isOverage || row.overageAmountCents !== overageAmountCents) {
          await tx.businessUsage.update({
            where: { id: row.id },
            data: { isOverage, overageAmountCents },
          });
        }
      }

      await tx.business.update({
        where: { id: businessId },
        data: { monthlyUsageCount: qualifying.length },
      });
    },
    { isolationLevel: "Serializable" }
  );
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
