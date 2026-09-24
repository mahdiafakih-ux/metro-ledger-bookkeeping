import Link from "next/link";
import { ArrowRight, ChevronRight, Hash, MapPin, MonitorSmartphone, RotateCcw } from "lucide-react";
import { appointmentStatus, appointmentTypeLabel } from "@/lib/portal/present";
import { detroitZoneAbbrev, formatDetroitDate, formatDetroitTime } from "@/lib/tz";
import { NotaryAvatar, PortalLink, StatusPill } from "./ui";
import { cn } from "@/lib/utils";

type NotaryLite = { id: string; displayName: string; photoUrl: string; isActive: boolean } | null;

export interface AppointmentLite {
  id: string;
  confirmationNumber: string;
  serviceType: string;
  type: string;
  status: string;
  address: string;
  scheduledStart: Date;
  assignedNotaryId: string | null;
  assignedNotary: NotaryLite;
  preferredNotary?: NotaryLite;
}

export function timeWithZone(d: Date) {
  return `${formatDetroitTime(d)} ${detroitZoneAbbrev(d)}`;
}

function DateTile({ date, muted }: { date: Date; muted?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border",
        muted ? "border-navy-100 bg-navy-50 text-navy-500" : "border-navy-100 bg-white text-navy-900"
      )}
      aria-hidden
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-accent-600">
        {formatDetroitDate(date, { month: "short", day: undefined, year: undefined })}
      </span>
      <span className="tabular text-xl font-semibold leading-none">
        {formatDetroitDate(date, { month: undefined, day: "numeric", year: undefined })}
      </span>
    </div>
  );
}

function Location({ a }: { a: AppointmentLite }) {
  if (a.type === "remote") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <MonitorSmartphone className="h-3.5 w-3.5 text-navy-400" aria-hidden /> Remote / online
      </span>
    );
  }
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <MapPin className="h-3.5 w-3.5 shrink-0 text-navy-400" aria-hidden />
      <span className="truncate">{a.address || "In person"}</span>
    </span>
  );
}

/** Compact list row used in lists and on the dashboard. */
export function AppointmentRow({ a, showRequestAgain = false }: { a: AppointmentLite; showRequestAgain?: boolean }) {
  const status = appointmentStatus(a);
  const muted = a.status === "cancelled" || a.status === "no_show";
  const notary = a.assignedNotary;
  return (
    <li className="group relative">
      <div className="flex items-center gap-4 px-5 py-4 transition-colors group-hover:bg-navy-50/60">
        <DateTile date={a.scheduledStart} muted={muted} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href={`/portal/appointments/${a.id}`}
              className={cn(
                "truncate text-[15px] font-semibold text-navy-950 after:absolute after:inset-0 after:content-['']",
                muted && "text-navy-500 line-through decoration-navy-300"
              )}
            >
              {a.serviceType}
            </Link>
            <StatusPill status={status} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-navy-500">
            <span className="tabular">
              {formatDetroitDate(a.scheduledStart, { weekday: "short", year: undefined })} · {timeWithZone(a.scheduledStart)}
            </span>
            <Location a={a} />
            <span className="hidden items-center gap-1 sm:inline-flex">
              <Hash className="h-3 w-3 text-navy-300" aria-hidden />
              <span className="tabular">{a.confirmationNumber}</span>
            </span>
          </div>
        </div>
        {notary ? (
          <div className="hidden items-center gap-2 md:flex" title={`Notary: ${notary.displayName}`}>
            <NotaryAvatar name={notary.displayName} photoUrl={notary.photoUrl} size={28} />
            <span className="text-[13px] font-medium text-navy-700">{notary.displayName}</span>
          </div>
        ) : null}
        <ChevronRight className="h-4 w-4 shrink-0 text-navy-300 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </div>
      {showRequestAgain && notary && notary.isActive && a.status === "completed" && (
        <div className="relative z-10 -mt-2 flex justify-end px-5 pb-3">
          <Link
            href={`/portal/request?notary=${notary.id}`}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-semibold text-accent-700 hover:bg-accent-100/60"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Request {notary.displayName} again
          </Link>
        </div>
      )}
    </li>
  );
}

/** Prominent "next appointment" card for the dashboard. */
export function NextAppointmentCard({ a }: { a: AppointmentLite }) {
  const status = appointmentStatus(a);
  const notary = a.assignedNotary;
  return (
    <div className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-navy-400">Next appointment</p>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.01em] text-navy-950">{a.serviceType}</h3>
        </div>
        <StatusPill status={status} />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        <div>
          <dt className="text-xs font-medium text-navy-400">Date</dt>
          <dd className="mt-0.5 text-sm font-semibold text-navy-900">
            {formatDetroitDate(a.scheduledStart, { weekday: "short", year: undefined })}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-navy-400">Time</dt>
          <dd className="tabular mt-0.5 text-sm font-semibold text-navy-900">{timeWithZone(a.scheduledStart)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-medium text-navy-400">{a.type === "remote" ? "Format" : "Location"}</dt>
          <dd className="mt-0.5 truncate text-sm font-semibold text-navy-900">
            {a.type === "remote" ? "Remote / online" : a.address || appointmentTypeLabel(a.type)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-navy-400">Confirmation</dt>
          <dd className="tabular mt-0.5 text-sm font-semibold text-navy-900">{a.confirmationNumber}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-col gap-4 border-t border-navy-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-sm">
          {notary ? (
            <>
              <NotaryAvatar name={notary.displayName} photoUrl={notary.photoUrl} size={32} />
              <div>
                <p className="font-semibold text-navy-900">{notary.displayName}</p>
                <p className="text-xs text-navy-400">Your assigned notary</p>
              </div>
            </>
          ) : (
            <p className="text-navy-500">
              {a.preferredNotary
                ? `Notary not yet assigned · you requested ${a.preferredNotary.displayName}`
                : "A Notar-E notary will be assigned before your appointment."}
            </p>
          )}
        </div>
        <PortalLink href={`/portal/appointments/${a.id}`} variant="secondary" size="sm">
          View details <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </PortalLink>
      </div>
    </div>
  );
}
