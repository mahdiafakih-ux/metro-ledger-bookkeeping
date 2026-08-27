import { prisma } from "./db";
import { cache } from "react";

export const getBusinessSettings = cache(async () => {
  const settings = await prisma.businessSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
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
