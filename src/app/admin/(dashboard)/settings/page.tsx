import { Download } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { getBusinessSettings } from "@/lib/settings";
import { BusinessInfoForm, HomepageWordingForm, GoalSettingsForm } from "@/components/admin/settings/general-forms";
import { AvailabilityForm, BlackoutDatesManager } from "@/components/admin/settings/availability-form";
import { ScorecardTargetsForm } from "@/components/admin/settings/scorecard-targets-form";
import { PricingPlanEditor } from "@/components/admin/settings/pricing-editor";
import { DemoDataSection } from "@/components/admin/settings/demo-data-section";

const DATA_EXPORTS = [
  { label: "Clients", href: "/api/export/clients" },
  { label: "Businesses", href: "/api/export/businesses" },
  { label: "Appointments", href: "/api/export/appointments" },
  { label: "Revenue", href: "/api/export/revenue" },
  { label: "Expenses", href: "/api/export/expenses" },
  { label: "Mileage", href: "/api/export/mileage" },
  { label: "Leads", href: "/api/export/leads" },
  { label: "Outreach", href: "/api/export/outreach" },
  { label: "Invoices", href: "/api/export/invoices" },
] as const;

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
        <CardHeader><CardTitle>Data Export &amp; Backups</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-navy-500">
            Download a CSV snapshot of any data category below — useful for backups, accounting, or moving data elsewhere.
          </p>
          <div className="flex flex-wrap gap-2">
            {DATA_EXPORTS.map((e) => (
              <LinkButton key={e.href} href={e.href} variant="outline" size="sm">
                <Download className="h-3.5 w-3.5" /> {e.label}
              </LinkButton>
            ))}
          </div>
          <div className="rounded-lg bg-navy-50 p-4 text-xs leading-relaxed text-navy-500">
            <p className="font-semibold text-navy-700">Database backups (Supabase)</p>
            <p className="mt-1">
              Supabase automatically takes daily backups on paid plans (Point-in-Time Recovery on Pro and above) —
              under Project Settings → Database → Backups you can restore to any recent point, or trigger a manual
              backup before a risky change. On the free tier, backups are retained for a shorter window, so it&apos;s
              worth periodically exporting the CSVs above, or running <code className="rounded bg-white px-1 py-0.5">pg_dump</code>{" "}
              against the connection string in Project Settings → Database for a full offline copy.
            </p>
          </div>
        </CardBody>
      </Card>

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
          {pricingPlans.map((plan: any) => (
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
