import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarPlus,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Heart,
  Plus,
  RotateCcw,
  Undo2,
} from "lucide-react";
import { getPortalAccount } from "@/lib/portal/account";
import { getDashboardData, type ActivityItem } from "@/lib/portal/queries";
import { formatCents } from "@/lib/money";
import { formatDateOnly, formatDetroitDate, formatDetroitDateTime, getZonedParts } from "@/lib/tz";
import { PREFERENCE_DISCLAIMER } from "@/lib/portal/constants";
import { sentence } from "@/lib/portal/present";
import { AppointmentRow, NextAppointmentCard } from "@/components/portal/appointment-views";
import { PlanCard } from "@/components/portal/plan-card";
import { AddPreferredButton } from "@/components/portal/notary-actions";
import { EmptyState, NotaryAvatar, PageHeader, Panel, PanelHeader, PortalLink } from "@/components/portal/ui";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

function greeting(now = new Date()) {
  const h = getZonedParts(now).hour;
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function PortalDashboard() {
  const account = await getPortalAccount();
  const data = await getDashboardData(account);
  const name = account.business?.companyName ?? account.client.firstName;
  const preferredIds = new Set(data.preferred.map((p) => p.notary.id));
  const suggestions = data.workedWith.filter((n) => !preferredIds.has(n.id)).slice(0, 2);
  const primary = data.preferred.find((p) => p.isPrimary) ?? data.preferred[0] ?? null;

  return (
    <div className="portal-enter space-y-6 lg:space-y-8">
      <PageHeader
        title={`${greeting()}, ${sentence(name)}`}
        description="Here's what's happening with your Notar-E account."
        actions={
          account.canRequest ? (
            <PortalLink href="/portal/request" size="lg" className="w-full sm:w-auto">
              <Plus className="h-5 w-5" aria-hidden /> Request a Notary
            </PortalLink>
          ) : undefined
        }
      />

      {data.outstanding.balanceCents > 0 && (
        <Link
          href="/portal/invoices"
          className="portal-lift flex items-center gap-4 rounded-xl border border-warning-100 bg-white p-4 sm:px-5"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning-100 text-warning-600">
            <CircleDollarSign className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-navy-950">
              <span className="tabular">{formatCents(data.outstanding.balanceCents)}</span> outstanding
            </span>
            <span className="block text-[13px] text-navy-500">
              {data.outstanding.count} unpaid invoice{data.outstanding.count === 1 ? "" : "s"} · view and pay online
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-navy-400" aria-hidden />
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Primary column */}
        <div className="space-y-6 lg:col-span-2">
          <Panel aria-labelledby="next-appt">
            <h2 id="next-appt" className="sr-only">Next appointment</h2>
            {data.next ? (
              <NextAppointmentCard a={data.next} />
            ) : (
              <EmptyState
                icon={CalendarPlus}
                title="No upcoming appointments"
                description="Need a notary? Request one in under a minute — in person or online where eligible."
                action={
                  account.canRequest ? (
                    <PortalLink href="/portal/request">
                      <Plus className="h-4 w-4" aria-hidden /> Request a Notary
                    </PortalLink>
                  ) : undefined
                }
              />
            )}
          </Panel>

          {data.upcoming.length > 0 && (
            <Panel>
              <PanelHeader
                title="Also coming up"
                action={
                  <Link href="/portal/appointments" className="text-[13px] font-semibold text-accent-700 hover:text-accent-600">
                    View all
                  </Link>
                }
              />
              <ul className="divide-y divide-navy-100">
                {data.upcoming.map((a) => (
                  <AppointmentRow key={a.id} a={a} />
                ))}
              </ul>
            </Panel>
          )}

          {/* At a glance */}
          <Panel className="overflow-hidden">
            <div className="grid grid-cols-2 gap-px bg-navy-100 sm:grid-cols-4">
              {[
                { label: "Upcoming", value: data.upcomingCount, href: "/portal/appointments" },
                { label: "This month", value: data.monthCount, href: "/portal/appointments" },
                { label: "Completed", value: data.completedCount, href: "/portal/appointments?tab=completed" },
                {
                  label: "Unpaid invoices",
                  value: data.outstanding.count,
                  href: "/portal/invoices",
                  warn: data.outstanding.count > 0,
                },
              ].map((m) => (
                <Link key={m.label} href={m.href} className="group bg-white px-5 py-4 transition-colors hover:bg-navy-50/60">
                  <span className="block text-xs font-medium text-navy-400">{m.label}</span>
                  <span className={cn("tabular mt-1 block text-2xl font-semibold tracking-[-0.02em]", m.warn ? "text-warning-600" : "text-navy-950")}>
                    {m.value}
                  </span>
                </Link>
              ))}
            </div>
          </Panel>
        </div>

        {/* Secondary column */}
        <div className="space-y-6">
          <PlanCard account={account} />

          {primary ? (
            <Panel>
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-navy-400">Your preferred notary</p>
                <div className="mt-4 flex items-center gap-3">
                  <NotaryAvatar name={primary.notary.displayName} photoUrl={primary.notary.photoUrl} size={44} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-navy-950">{primary.notary.displayName}</p>
                    <p className="text-[13px] text-navy-500">
                      {primary.lastAppointment
                        ? `Last appointment ${formatDetroitDate(primary.lastAppointment, { year: undefined })}`
                        : "No completed appointments yet"}
                    </p>
                  </div>
                </div>
                {primary.notary.isActive && account.canRequest ? (
                  <PortalLink href={`/portal/request?notary=${primary.notary.id}`} variant="secondary" className="mt-4 w-full">
                    <RotateCcw className="h-4 w-4" aria-hidden /> Request {primary.notary.displayName} again
                  </PortalLink>
                ) : (
                  <p className="mt-4 text-[13px] text-navy-500">This notary is not currently taking appointments.</p>
                )}
                {data.preferred.length > 1 && (
                  <Link href="/portal/appointments?tab=notaries" className="mt-3 block text-center text-[13px] font-semibold text-accent-700 hover:text-accent-600">
                    View all {data.preferred.length} preferred notaries
                  </Link>
                )}
              </div>
            </Panel>
          ) : suggestions.length > 0 && account.canRequest ? (
            <Panel>
              <PanelHeader title="Worked with a notary you liked?" description={PREFERENCE_DISCLAIMER} />
              <ul className="divide-y divide-navy-100">
                {suggestions.map((n) => (
                  <li key={n.id} className="flex flex-col gap-3 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <NotaryAvatar name={n.displayName} photoUrl={n.photoUrl} size={36} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-navy-950">{n.displayName}</p>
                        {n.lastAppointment && (
                          <p className="text-xs text-navy-500">
                            Last appointment {formatDetroitDate(n.lastAppointment, { year: undefined })}
                          </p>
                        )}
                      </div>
                    </div>
                    <AddPreferredButton notaryId={n.id} name={n.displayName} isPreferred={false} className="w-full" />
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <Panel>
            <PanelHeader title="Recent activity" />
            {data.activity.length > 0 ? (
              <ol className="px-5 py-3">
                {data.activity.map((item, i) => (
                  <ActivityRow key={item.id} item={item} last={i === data.activity.length - 1} />
                ))}
              </ol>
            ) : (
              <EmptyState compact icon={Heart} title="Nothing here yet" description="Appointments, invoices and payments will show up here." />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

const ACTIVITY_ICON = {
  scheduled: { icon: CalendarCheck2, cls: "bg-accent-100 text-accent-700" },
  completed: { icon: CheckCircle2, cls: "bg-success-100 text-success-600" },
  invoice: { icon: FileText, cls: "bg-navy-100 text-navy-600" },
  payment: { icon: CircleDollarSign, cls: "bg-success-100 text-success-600" },
  refund: { icon: Undo2, cls: "bg-navy-100 text-navy-600" },
} as const;

function ActivityRow({ item, last }: { item: ActivityItem; last: boolean }) {
  const { icon: Icon, cls } = ACTIVITY_ICON[item.kind];
  const body = (
    <>
      <span className={cn("relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full", cls)}>
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 pb-4">
        <span className="block text-[13px] font-semibold text-navy-900">{item.title}</span>
        <span className="block truncate text-[13px] text-navy-500">{item.detail}</span>
        <time dateTime={item.at.toISOString()} className="tabular block text-xs text-navy-400">
          {item.dateOnly ? formatDateOnly(item.at, { year: undefined }) : formatDetroitDateTime(item.at, { year: undefined })}
        </time>
      </span>
    </>
  );
  return (
    <li className="relative flex gap-3 pt-1">
      {!last && <span aria-hidden className="absolute left-[13px] top-8 bottom-0 w-px bg-navy-100" />}
      {item.href ? (
        <Link href={item.href} className="flex min-w-0 flex-1 gap-3 rounded-lg hover:opacity-80">
          {body}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 gap-3">{body}</div>
      )}
    </li>
  );
}
