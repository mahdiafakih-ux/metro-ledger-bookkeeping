import Link from "next/link";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  addWeeks,
  format,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, MapPin, Video, Ban } from "lucide-react";
import { prisma } from "@/lib/db";
import { LinkButton } from "@/components/ui/button";
import { Badge, STATUS_TONES } from "@/components/ui/badge";
import { BlockTimeButton, BlockedTimeList } from "@/components/admin/block-time-form";
import { cn, titleCase } from "@/lib/utils";
import { fromZonedWallDate, toZonedWallDate } from "@/lib/tz";
import { formatCents } from "@/lib/money";

type AdminBlockRow = { id: string; startTime: Date; endTime: Date; reason: string };

type View = "month" | "week" | "day";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const sp = await searchParams;
  const view = (sp.view as View) || "month";
  // The grid works in America/Detroit "wall" dates (see toZonedWallDate) so
  // day boundaries and times are correct regardless of the server's TZ.
  const todayWall = toZonedWallDate(new Date());
  const anchor = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? new Date(`${sp.date}T00:00:00`) : todayWall;

  let rangeStart: Date, rangeEnd: Date;
  if (view === "month") {
    rangeStart = startOfWeek(startOfMonth(anchor));
    rangeEnd = endOfWeek(endOfMonth(anchor));
  } else if (view === "week") {
    rangeStart = startOfWeek(anchor);
    rangeEnd = endOfWeek(anchor);
  } else {
    rangeStart = new Date(anchor);
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd = new Date(anchor);
    rangeEnd.setHours(23, 59, 59, 999);
  }

  const queryStart = fromZonedWallDate(rangeStart);
  const queryEnd = fromZonedWallDate(rangeEnd);
  const [rawAppointments, rawBlocks] = await Promise.all([
    prisma.appointment.findMany({
      where: { scheduledStart: { gte: queryStart, lte: queryEnd }, status: { not: "cancelled" } },
      orderBy: { scheduledStart: "asc" },
    }),
    prisma.adminBlock.findMany({
      where: { startTime: { lte: queryEnd }, endTime: { gte: queryStart } },
      orderBy: { startTime: "asc" },
    }),
  ]);
  const appointments = rawAppointments.map((a) => ({
    ...a,
    scheduledStart: toZonedWallDate(a.scheduledStart),
    scheduledEnd: toZonedWallDate(a.scheduledEnd),
  }));
  const adminBlocks = rawBlocks.map((b) => ({
    ...b,
    startTime: toZonedWallDate(b.startTime),
    endTime: toZonedWallDate(b.endTime),
  }));

  const prevDate = view === "month" ? addMonths(anchor, -1) : view === "week" ? addWeeks(anchor, -1) : addDays(anchor, -1);
  const nextDate = view === "month" ? addMonths(anchor, 1) : view === "week" ? addWeeks(anchor, 1) : addDays(anchor, 1);
  const dateParam = (d: Date) => format(d, "yyyy-MM-dd");

  const title =
    view === "month" ? format(anchor, "MMMM yyyy") :
    view === "week" ? `${format(startOfWeek(anchor), "MMM d")} – ${format(endOfWeek(anchor), "MMM d, yyyy")}` :
    format(anchor, "EEEE, MMMM d, yyyy");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Calendar</h1>
          <p className="mt-1 text-sm text-navy-400">{title}</p>
        </div>
        <LinkButton href={`/admin/appointments/new?date=${dateParam(anchor)}`}><Plus className="h-4 w-4" /> New Appointment</LinkButton>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-navy-100 bg-white p-1">
          <Link href={`/admin/calendar?view=${view}&date=${dateParam(prevDate)}`} className="flex h-8 w-8 items-center justify-center rounded-md text-navy-500 hover:bg-navy-50"><ChevronLeft className="h-4 w-4" /></Link>
          <Link href={`/admin/calendar?view=${view}&date=${dateParam(todayWall)}`} className="px-3 text-sm font-medium text-navy-700 hover:text-accent-600">Today</Link>
          <Link href={`/admin/calendar?view=${view}&date=${dateParam(nextDate)}`} className="flex h-8 w-8 items-center justify-center rounded-md text-navy-500 hover:bg-navy-50"><ChevronRight className="h-4 w-4" /></Link>
        </div>
        <div className="flex gap-1 rounded-lg border border-navy-100 bg-white p-1">
          {(["day", "week", "month"] as View[]).map((v) => (
            <Link
              key={v}
              href={`/admin/calendar?view=${v}&date=${dateParam(anchor)}`}
              className={cn("rounded-md px-3 py-1.5 text-sm font-medium", view === v ? "bg-accent-500 text-white" : "text-navy-500 hover:bg-navy-50")}
            >
              {titleCase(v)}
            </Link>
          ))}
        </div>
      </div>

      {view === "month" && <MonthGrid anchor={anchor} today={todayWall} rangeStart={rangeStart} appointments={appointments} adminBlocks={adminBlocks} />}
      {view === "week" && <WeekGrid today={todayWall} rangeStart={rangeStart} appointments={appointments} adminBlocks={adminBlocks} />}
      {view === "day" && <DayList anchor={anchor} appointments={appointments} rawBlocks={rawBlocks} />}
    </div>
  );
}

function MonthGrid({
  anchor,
  today,
  rangeStart,
  appointments,
  adminBlocks,
}: {
  anchor: Date;
  today: Date;
  rangeStart: Date;
  appointments: Awaited<ReturnType<typeof prisma.appointment.findMany>>;
  adminBlocks: AdminBlockRow[];
}) {
  const days = Array.from({ length: 42 }).map((_, i) => addDays(rangeStart, i));
  return (
    <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white">
      <div className="grid grid-cols-7 border-b border-navy-100 bg-navy-50 text-xs font-semibold uppercase tracking-wide text-navy-400">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="px-3 py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day: any) => {
          const dayAppts = appointments.filter((a: any) => isSameDay(a.scheduledStart, day));
          const dayBlocks = adminBlocks.filter((b) => isSameDay(b.startTime, day));
          return (
            <Link
              key={day.toISOString()}
              href={`/admin/calendar?view=day&date=${format(day, "yyyy-MM-dd")}`}
              className={cn(
                "min-h-28 border-b border-r border-navy-100 p-2 text-left hover:bg-navy-50",
                !isSameMonth(day, anchor) && "bg-navy-50/50 text-navy-300"
              )}
            >
              <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold", isSameDay(day, today) && "bg-accent-500 text-white")}>
                {format(day, "d")}
              </span>
              <div className="mt-1 space-y-1">
                {dayAppts.slice(0, 3).map((a: any) => (
                  <p key={a.id} className="truncate rounded bg-accent-100 px-1.5 py-0.5 text-[11px] font-medium text-accent-700">
                    {format(a.scheduledStart, "h:mma")} {a.clientName}
                  </p>
                ))}
                {dayBlocks.map((b) => (
                  <p key={b.id} className="flex items-center gap-1 truncate rounded bg-navy-200 px-1.5 py-0.5 text-[11px] font-medium text-navy-600">
                    <Ban className="h-2.5 w-2.5 shrink-0" /> Blocked
                  </p>
                ))}
                {dayAppts.length > 3 && <p className="text-[11px] font-medium text-navy-400">+{dayAppts.length - 3} more</p>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({
  today,
  rangeStart,
  appointments,
  adminBlocks,
}: {
  today: Date;
  rangeStart: Date;
  appointments: Awaited<ReturnType<typeof prisma.appointment.findMany>>;
  adminBlocks: AdminBlockRow[];
}) {
  const days = Array.from({ length: 7 }).map((_, i) => addDays(rangeStart, i));
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {days.map((day: any) => {
        const dayAppts = appointments.filter((a: any) => isSameDay(a.scheduledStart, day));
        const dayBlocks = adminBlocks.filter((b) => isSameDay(b.startTime, day));
        return (
          <div key={day.toISOString()} className="rounded-2xl border border-navy-100 bg-white p-3">
            <p className={cn("mb-2 text-sm font-bold", isSameDay(day, today) ? "text-accent-600" : "text-navy-700")}>{format(day, "EEE d")}</p>
            <div className="space-y-2">
              {dayAppts.length === 0 && dayBlocks.length === 0 && <p className="text-xs text-navy-300">No appointments</p>}
              {dayAppts.map((a: any) => (
                <Link key={a.id} href={`/admin/appointments/${a.id}`} className="block rounded-lg bg-navy-50 p-2 hover:bg-accent-100/50">
                  <p className="text-xs font-semibold text-navy-900">{format(a.scheduledStart, "h:mm a")}</p>
                  <p className="truncate text-xs text-navy-500">{a.clientName}</p>
                </Link>
              ))}
              {dayBlocks.map((b) => (
                <div key={b.id} className="flex items-center gap-1.5 rounded-lg bg-navy-100 p-2 text-xs font-medium text-navy-500">
                  <Ban className="h-3 w-3 shrink-0" /> {format(b.startTime, "h:mm a")}–{format(b.endTime, "h:mm a")}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayList({
  anchor,
  appointments,
  rawBlocks,
}: {
  anchor: Date;
  appointments: Awaited<ReturnType<typeof prisma.appointment.findMany>>;
  rawBlocks: AdminBlockRow[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-navy-100 bg-white p-4">
        <div>
          <p className="text-sm font-semibold text-navy-900">Manual Time Blocks</p>
          <p className="text-xs text-navy-400">Hold time on the calendar without a booking — customers won&apos;t see this slot as available.</p>
        </div>
        <BlockTimeButton date={format(anchor, "yyyy-MM-dd")} />
      </div>
      <BlockedTimeList blocks={rawBlocks} />

      <div className="rounded-2xl border border-navy-100 bg-white">
        {appointments.length === 0 ? (
          <p className="p-10 text-center text-sm text-navy-400">No appointments on {format(anchor, "MMMM d, yyyy")}.</p>
        ) : (
          <ul className="divide-y divide-navy-100">
            {appointments.map((a: any) => (
              <li key={a.id}>
                <Link href={`/admin/appointments/${a.id}`} className="flex items-center justify-between gap-4 p-5 hover:bg-navy-50">
                  <div className="flex items-center gap-4">
                    <div className="w-20 shrink-0 text-sm font-bold text-navy-900">{format(a.scheduledStart, "h:mm a")}</div>
                    <div>
                      <p className="font-semibold text-navy-900">{a.clientName}</p>
                      <p className="flex items-center gap-1.5 text-xs text-navy-400">
                        {a.type === "remote" ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                        {a.serviceType}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-navy-700">{formatCents(a.totalAmountCents, { showCents: false })}</span>
                    <Badge tone={STATUS_TONES[a.status] ?? "neutral"}>{titleCase(a.status)}</Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
