"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Briefcase, CalendarClock, AlertTriangle, PartyPopper, RefreshCw, CalendarPlus, CircleDot } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { markAllNotificationsRead } from "@/lib/actions/notifications";

type NotificationView = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  createdAt: Date;
};

const ICONS: Record<string, typeof Bell> = {
  appointment_upcoming: CalendarClock,
  follow_up_due: AlertTriangle,
  invoice_unpaid: AlertTriangle,
  goal_milestone: PartyPopper,
  renewal: RefreshCw,
  new_booking: CalendarPlus,
  career_application: Briefcase,
};

export function NotificationsMenu({ notifications, unreadCount }: { notifications: NotificationView[]; unreadCount: number }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(unreadCount);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-navy-500 hover:bg-navy-50"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-navy-100 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-navy-100 p-4">
              <p className="font-semibold text-navy-900">Notifications</p>
              {count > 0 && (
                <button
                  onClick={async () => {
                    await markAllNotificationsRead();
                    setCount(0);
                  }}
                  className="text-xs font-semibold text-accent-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="themed-scroll max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-6 text-center text-sm text-navy-400">You&apos;re all caught up.</p>
              ) : (
                notifications.map((n) => {
                  const Icon = ICONS[n.type] ?? CircleDot;
                  return (
                    <Link
                      key={n.id}
                      href={n.link || "#"}
                      onClick={() => setOpen(false)}
                      className="flex gap-3 border-b border-navy-50 p-4 last:border-0 hover:bg-navy-50"
                    >
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${n.isRead ? "bg-navy-100 text-navy-400" : "bg-accent-100 text-accent-600"}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy-900">{n.title}</p>
                        {n.body && <p className="truncate text-xs text-navy-400">{n.body}</p>}
                        <p className="mt-0.5 text-[11px] text-navy-300">{formatDateTime(n.createdAt)}</p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
