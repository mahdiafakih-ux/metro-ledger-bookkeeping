import Link from "next/link";
import { CalendarCheck2, CalendarPlus, CalendarX2, Heart, Plus, RotateCcw, Users } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sentence } from "@/lib/portal/present";
import { appointmentScope, getPortalAccount, MAX_PREFERRED_NOTARIES } from "@/lib/portal/account";
import { getPreferredNotaries, getWorkedWithNotaries } from "@/lib/portal/queries";
import { PREFERENCE_DISCLAIMER } from "@/lib/portal/constants";
import { formatDetroitDate } from "@/lib/tz";
import { AppointmentRow } from "@/components/portal/appointment-views";
import { AddPreferredButton, PreferenceControls } from "@/components/portal/notary-actions";
import { EmptyState, NotaryAvatar, PageHeader, Panel, PanelHeader, PortalLink } from "@/components/portal/ui";
import { cn } from "@/lib/utils";

export const metadata = { title: "Appointments" };

const PAGE_SIZE = 50;
type Tab = "upcoming" | "completed" | "cancelled" | "notaries";
const TABS: { key: Tab; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "notaries", label: "Preferred notaries" },
];

const notarySelect = { id: true, displayName: true, photoUrl: true, isActive: true } as const;

export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const sp = await searchParams;
  const tab: Tab = (TABS.find((t) => t.key === sp.tab)?.key ?? "upcoming") as Tab;
  const account = await getPortalAccount();
  const scope = appointmentScope(account);
  const now = new Date();

  const where: Record<Exclude<Tab, "notaries">, Prisma.AppointmentWhereInput> = {
    upcoming: { AND: [scope, { status: "scheduled", scheduledEnd: { gte: now } }] },
    // Past scheduled appointments not yet marked complete appear under Completed
    // only once they're marked; missed (no-show) ones sit with cancelled.
    completed: { AND: [scope, { status: "completed" }] },
    cancelled: { AND: [scope, { status: { in: ["cancelled", "no_show"] } }] },
  };

  const [counts, rows, awaiting] = await Promise.all([
    Promise.all([
      prisma.appointment.count({ where: where.upcoming }),
      prisma.appointment.count({ where: where.completed }),
      prisma.appointment.count({ where: where.cancelled }),
    ]),
    tab === "notaries"
      ? Promise.resolve([])
      : prisma.appointment.findMany({
          where: where[tab],
          orderBy: { scheduledStart: tab === "upcoming" ? "asc" : "desc" },
          take: PAGE_SIZE,
          include: { assignedNotary: { select: notarySelect }, preferredNotary: { select: notarySelect } },
        }),
    // Past appointments still "scheduled" (awaiting completion by Notar-E).
    tab === "upcoming"
      ? prisma.appointment.findMany({
          where: { AND: [scope, { status: "scheduled", scheduledEnd: { lt: now } }] },
          orderBy: { scheduledStart: "desc" },
          take: 10,
          include: { assignedNotary: { select: notarySelect } },
        })
      : Promise.resolve([]),
  ]);
  const countFor: Record<Tab, number | null> = { upcoming: counts[0], completed: counts[1], cancelled: counts[2], notaries: null };

  return (
    <div className="portal-enter space-y-6">
      <PageHeader
        title="Appointments"
        description={account.canViewBusiness ? `All appointments for ${sentence(account.business?.companyName ?? "")}` : "Your notary appointments, past and upcoming."}
        actions={
          account.canRequest ? (
            <PortalLink href="/portal/request">
              <Plus className="h-4 w-4" aria-hidden /> Request a Notary
            </PortalLink>
          ) : undefined
        }
      />

      <nav aria-label="Appointment views" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex min-w-max gap-1 border-b border-navy-100">
          {TABS.map((t) => {
            const active = t.key === tab;
            const count = countFor[t.key];
            return (
              <li key={t.key}>
                <Link
                  href={t.key === "upcoming" ? "/portal/appointments" : `/portal/appointments?tab=${t.key}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex h-10 items-center gap-2 px-3 text-sm font-medium transition-colors",
                    active ? "text-navy-950" : "text-navy-500 hover:text-navy-900"
                  )}
                >
                  {t.label}
                  {count != null && (
                    <span className={cn("tabular rounded-full px-1.5 text-xs", active ? "bg-navy-900 text-white" : "bg-navy-100 text-navy-600")}>
                      {count}
                    </span>
                  )}
                  {active && <span aria-hidden className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent-600" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {tab === "notaries" ? (
        <PreferredNotariesSection />
      ) : (
        <>
          <Panel>
            {rows.length > 0 ? (
              <ul className="divide-y divide-navy-100">
                {rows.map((a) => (
                  <AppointmentRow key={a.id} a={a} showRequestAgain={tab === "completed" && account.canRequest} />
                ))}
              </ul>
            ) : tab === "upcoming" ? (
              <EmptyState
                icon={CalendarPlus}
                title="No upcoming appointments"
                description="Need a notary? Request one in under a minute."
                action={
                  account.canRequest ? (
                    <PortalLink href="/portal/request">
                      <Plus className="h-4 w-4" aria-hidden /> Request a Notary
                    </PortalLink>
                  ) : undefined
                }
              />
            ) : tab === "completed" ? (
              <EmptyState icon={CalendarCheck2} title="No completed appointments yet" description="Once an appointment is completed, you'll see it here along with the notary who handled it." />
            ) : (
              <EmptyState icon={CalendarX2} title="Nothing cancelled" description="Cancelled or missed appointments will appear here." />
            )}
          </Panel>
          {rows.length === PAGE_SIZE && (
            <p className="text-center text-[13px] text-navy-400">Showing the {PAGE_SIZE} most recent. Contact us for a full history export.</p>
          )}

          {awaiting.length > 0 && (
            <Panel>
              <PanelHeader title="Awaiting completion" description="These appointment times have passed. Notar-E will mark them complete shortly." />
              <ul className="divide-y divide-navy-100">
                {awaiting.map((a) => (
                  <AppointmentRow key={a.id} a={a} />
                ))}
              </ul>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}

async function PreferredNotariesSection() {
  const account = await getPortalAccount();
  const [preferred, workedWith] = await Promise.all([getPreferredNotaries(account), getWorkedWithNotaries(account)]);
  const preferredIds = new Set(preferred.map((p) => p.notary.id));
  const others = workedWith.filter((n) => !preferredIds.has(n.id));
  const full = preferred.length >= MAX_PREFERRED_NOTARIES;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Panel className="lg:col-span-3">
        <PanelHeader
          title={account.business ? `${account.business.companyName} preferred notaries` : "Your preferred notaries"}
          description={
            account.business
              ? `Shared by everyone on your team · up to ${MAX_PREFERRED_NOTARIES}`
              : `Up to ${MAX_PREFERRED_NOTARIES} notaries you'd like us to prioritize`
          }
        />
        {preferred.length > 0 ? (
          <ul className="divide-y divide-navy-100">
            {preferred.map((p) => (
              <li key={p.preferenceId} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <NotaryAvatar name={p.notary.displayName} photoUrl={p.notary.photoUrl} size={44} />
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate font-semibold text-navy-950">
                      {p.notary.displayName}
                      {p.isPrimary && (
                        <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-accent-700">
                          Primary
                        </span>
                      )}
                    </p>
                    <p className="text-[13px] text-navy-500">
                      {!p.notary.isActive
                        ? "Not currently taking appointments"
                        : p.lastAppointment
                        ? `Last appointment ${formatDetroitDate(p.lastAppointment)}`
                        : "No completed appointments yet"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.notary.isActive && account.canRequest && (
                    <PortalLink href={`/portal/request?notary=${p.notary.id}`} variant="secondary" size="sm">
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Request
                    </PortalLink>
                  )}
                  {account.canRequest && (
                    <PreferenceControls preferenceId={p.preferenceId} name={p.notary.displayName} isPrimary={p.isPrimary} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Heart}
            title="No preferred notaries yet"
            description="After a completed appointment, add the notary who helped you so you can request them again."
          />
        )}
        <p className="border-t border-navy-100 px-5 py-3 text-[13px] text-navy-500">{PREFERENCE_DISCLAIMER}</p>
      </Panel>

      <Panel className="lg:col-span-2">
        <PanelHeader title="Notaries you've worked with" description="From your completed appointments" />
        {others.length > 0 ? (
          <ul className="divide-y divide-navy-100">
            {others.map((n) => (
              <li key={n.id} className="flex flex-col gap-3 px-5 py-4">
                <div className="flex items-center gap-3">
                  <NotaryAvatar name={n.displayName} photoUrl={n.photoUrl} size={36} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy-950">{n.displayName}</p>
                    {n.lastAppointment && (
                      <p className="text-xs text-navy-500">Last appointment {formatDetroitDate(n.lastAppointment)}</p>
                    )}
                  </div>
                </div>
                {account.canRequest && (
                  <div className="flex flex-wrap gap-2">
                    {!full && <AddPreferredButton notaryId={n.id} name={n.displayName} isPreferred={false} />}
                    <PortalLink href={`/portal/request?notary=${n.id}`} variant="ghost" size="sm">
                      Request again
                    </PortalLink>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            compact
            icon={Users}
            title={preferred.length ? "You're all set" : "No completed appointments yet"}
            description={preferred.length ? "Everyone you've worked with is already on your list." : "Notaries appear here after they complete an appointment for you."}
          />
        )}
        {full && others.length > 0 && (
          <p className="border-t border-navy-100 px-5 py-3 text-[13px] text-navy-500">
            You have {MAX_PREFERRED_NOTARIES} preferred notaries. Remove one to add another.
          </p>
        )}
      </Panel>
    </div>
  );
}
