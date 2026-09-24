import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getPortalAccount } from "@/lib/portal/account";
import { getPreferredNotaries, getWorkedWithNotaries } from "@/lib/portal/queries";
import { getBusinessSettings } from "@/lib/settings";
import { addDaysISO, dateOnlyToUtc, detroitTodayISO } from "@/lib/tz";
import { SERVICE_TYPES } from "@/lib/constants";
import { PageHeader } from "@/components/portal/ui";
import { RequestForm, type RequestNotaryOption } from "@/components/portal/request-form";

export const metadata = { title: "Request a Notary" };

export default async function RequestPage({ searchParams }: { searchParams: Promise<{ notary?: string }> }) {
  const account = await getPortalAccount();
  if (!account.canRequest) redirect("/portal/dashboard");
  const sp = await searchParams;

  const [settings, preferred, workedWith, rules, blackouts, individual] = await Promise.all([
    getBusinessSettings(),
    getPreferredNotaries(account),
    getWorkedWithNotaries(account),
    prisma.availabilityRule.findMany({ where: { isActive: true }, select: { dayOfWeek: true } }),
    prisma.blackoutDate.findMany({ where: { date: { gte: dateOnlyToUtc(addDaysISO(detroitTodayISO(), -1))! } }, select: { date: true } }),
    prisma.pricingPlan.findUnique({ where: { key: "individual" } }),
  ]);

  // Notary options: preferred first (primary first), then others this account
  // has worked with. Inactive notaries are never offered.
  const options: RequestNotaryOption[] = [];
  for (const p of preferred) {
    if (p.notary.isActive) options.push({ id: p.notary.id, name: p.notary.displayName, photoUrl: p.notary.photoUrl, preferred: true, primary: p.isPrimary });
  }
  for (const n of workedWith) {
    if (!options.some((o) => o.id === n.id)) options.push({ id: n.id, name: n.displayName, photoUrl: n.photoUrl, preferred: false, primary: false });
  }
  // Only honor ?notary= if it's one this account may actually request.
  const initialNotaryId = sp.notary && options.some((o) => o.id === sp.notary) ? sp.notary : "";

  const underSubscription =
    (account.plan.kind === "business30" || account.plan.kind === "unlimited") &&
    ["", "active", "past_due", "trialing"].includes(account.plan.status);

  return (
    <div className="portal-enter mx-auto max-w-3xl space-y-6">
      <PageHeader title="Request a Notary" description="Tell us when and where — most appointments take about 20 minutes." />
      <RequestForm
        todayISO={detroitTodayISO()}
        maxAdvanceDays={settings.maxAdvanceDays}
        activeWeekdays={[...new Set(rules.map((r) => r.dayOfWeek))]}
        // Date-only values are stored at UTC midnight (see src/lib/tz.ts).
        blackoutDates={blackouts.map((b) => b.date.toISOString().slice(0, 10))}
        vacationMessage={settings.vacationMode ? settings.vacationMessage || "We're temporarily not accepting new online requests." : ""}
        serviceTypes={[...SERVICE_TYPES]}
        notaries={options}
        initialNotaryId={initialNotaryId}
        defaultPhone={account.client.phone}
        pricing={
          underSubscription
            ? { mode: "subscription", planName: account.plan.name }
            : individual
            ? {
                mode: "payg",
                statutoryFeeCents: individual.statutoryFeeCents,
                serviceFeeCents: individual.serviceFeeCents,
                serviceFeeLabel: individual.serviceFeeLabel,
              }
            : { mode: "unavailable" }
        }
        supportPhone={settings.phone}
      />
    </div>
  );
}
