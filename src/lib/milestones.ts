import { prisma } from "@/lib/db";
import { MILESTONE_CENTS } from "@/lib/goal";
import { createNotification } from "@/lib/actions/notifications";

/**
 * Not a Server Action — called both from the admin "Add Revenue" action and
 * from the unauthenticated Stripe webhook handler, so it can't require an
 * admin session itself.
 */
export async function checkAndRecordMilestones(beforeCents: number, afterCents: number) {
  const crossed = MILESTONE_CENTS.filter((m) => beforeCents < m && afterCents >= m);
  for (const m of crossed) {
    await prisma.milestoneAchievement.upsert({
      where: { amountCents: m },
      update: {},
      create: { amountCents: m, seen: false },
    });
    await createNotification({
      type: "goal_milestone",
      title: `🎉 Milestone reached: $${(m / 100).toLocaleString()}`,
      body: "You're one step closer to your $50,000 goal!",
      link: "/admin/goal",
    });
  }
  return crossed;
}
