import { prisma } from "./db";
import { cache } from "react";

// A pure read, deliberately never a mutation: this is called from public
// pages that Next.js can attempt to statically prerender at build time
// (including on Vercel, where the build environment may not have DB
// access yet), and a write in that path either breaks the build or races
// across concurrent prerender workers. The one true row is created by
// `npm run db:seed` and kept up to date by the admin setup wizard and
// Settings page — if it's ever missing, that's a real deployment problem
// (seed step skipped) worth a clear error, not something to paper over
// with fabricated defaults.
export const getBusinessSettings = cache(async () => {
  const settings = await prisma.businessSettings.findUnique({ where: { id: "default" } });
  if (!settings) {
    throw new Error(
      "BusinessSettings row is missing — run `npm run db:seed` against this database before serving traffic."
    );
  }
  return settings;
});

export const getActivePricingPlans = cache(async () => {
  const plans = await prisma.pricingPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return plans.map((p) => ({ ...p, features: JSON.parse(p.features) as string[] }));
});

export const getAvailability = cache(async () => {
  const rules = await prisma.availabilityRule.findMany({ orderBy: { dayOfWeek: "asc" } });
  const blackouts = await prisma.blackoutDate.findMany({ orderBy: { date: "asc" } });
  return { rules, blackouts };
});
