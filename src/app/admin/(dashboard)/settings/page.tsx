import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { getBusinessSettings } from "@/lib/settings";
import { BusinessInfoForm, HomepageWordingForm, GoalSettingsForm } from "@/components/admin/settings/general-forms";
import { AvailabilityForm, BlackoutDatesManager } from "@/components/admin/settings/availability-form";
import { ScorecardTargetsForm } from "@/components/admin/settings/scorecard-targets-form";
import { PricingPlanEditor } from "@/components/admin/settings/pricing-editor";
import { DemoDataSection } from "@/components/admin/settings/demo-data-section";

export default async function SettingsPage() {
  const [settings, availabilityRules, blackoutDates, pricingPlans] = await Promise.all([
    getBusinessSettings(),
    prisma.availabilityRule.findMany({ orderBy: { dayOfWeek: "asc" } }),
    prisma.blackoutDate.findMany({ orderBy: { date: "asc" } }),
    prisma.pricingPlan.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const activeDays = availabilityRules.map((r) => r.dayOfWeek);
  const startTime = availabilityRules[0]?.startTime ?? "09:00";
  const endTime = availabilityRules[0]?.endTime ?? "19:00";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Settings</h1>
        <p className="mt-1 text-sm text-navy-400">Business info, pricing, availability, and goals — no code changes needed.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Demo Data</CardTitle></CardHeader>
        <CardBody><DemoDataSection demoDataSeeded={settings.demoDataSeeded} /></CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Business Information</CardTitle></CardHeader>
        <CardBody>
          <BusinessInfoForm initial={{
            businessName: settings.businessName, phone: settings.phone, email: settings.email,
            serviceArea: settings.serviceArea, addressLine: settings.addressLine,
            facebookUrl: settings.facebookUrl, instagramUrl: settings.instagramUrl,
            linkedinUrl: settings.linkedinUrl, googleBusinessUrl: settings.googleBusinessUrl,
          }} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Homepage Wording</CardTitle></CardHeader>
        <CardBody>
          <HomepageWordingForm initial={{ heroHeadline: settings.heroHeadline, heroSubheadline: settings.heroSubheadline }} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>$50,000 Goal</CardTitle></CardHeader>
        <CardBody>
          <GoalSettingsForm initial={{ goalAmountDollars: settings.goalAmountCents / 100, goalDeadline: settings.goalDeadline.toISOString().slice(0, 10) }} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Availability</CardTitle></CardHeader>
        <CardBody>
          <AvailabilityForm initial={{
            activeDays, startTime, endTime,
            appointmentDurationMinutes: settings.appointmentDurationMinutes,
            bufferMinutes: settings.bufferMinutes,
            minNoticeHours: settings.minNoticeHours,
            maxAdvanceDays: settings.maxAdvanceDays,
            vacationMode: settings.vacationMode,
            vacationMessage: settings.vacationMessage,
          }} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Blackout Dates</CardTitle></CardHeader>
        <CardBody><BlackoutDatesManager initial={blackoutDates} /></CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Daily Scorecard Targets</CardTitle></CardHeader>
        <CardBody>
          <ScorecardTargetsForm initial={{
            targetBusinessesContacted: settings.targetBusinessesContacted,
            targetCalls: settings.targetCalls,
            targetEmails: settings.targetEmails,
            targetFollowUps: settings.targetFollowUps,
          }} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pricing Plans</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          {pricingPlans.map((plan) => (
            <PricingPlanEditor
              key={plan.id}
              plan={{
                id: plan.id,
                key: plan.key,
                name: plan.name,
                statutoryFeeDollars: plan.statutoryFeeCents / 100,
                serviceFeeDollars: plan.serviceFeeCents / 100,
                serviceFeeLabel: plan.serviceFeeLabel,
                appointmentsIncluded: plan.appointmentsIncluded,
                overageFeeDollars: plan.overageFeeCents != null ? plan.overageFeeCents / 100 : null,
                description: plan.description,
                highlight: plan.highlight,
                isActive: plan.isActive,
              }}
            />
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
