"use client";

import { useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { NotificationsMenu } from "./notifications-menu";

type NotificationView = Parameters<typeof NotificationsMenu>[0]["notifications"][number];

export function AdminShell({
  children,
  userName,
  notifications,
  unreadCount,
}: {
  children: React.ReactNode;
  userName: string;
  notifications: NotificationView[];
  unreadCount: number;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="flex h-screen overflow-hidden bg-navy-50">
      {/* Desktop sidebar */}
      <div className="no-print hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print flex h-16 shrink-0 items-center gap-3 border-b border-navy-100 bg-white px-4 sm:px-6">
          <button
            className="text-navy-500 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          <form
            className="hidden flex-1 max-w-md sm:block"
            onSubmit={(e) => {
              e.preventDefault();
              const q = new FormData(e.currentTarget).get("q");
              if (q) router.push(`/admin/search?q=${encodeURIComponent(String(q))}`);
            }}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
              <input
                name="q"
                placeholder="Search clients, businesses, appointments, invoices..."
                className="w-full rounded-lg border border-navy-200 bg-navy-50 py-2 pl-9 pr-3 text-sm focus:border-accent-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-100"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-3">
            <NotificationsMenu notifications={notifications} unreadCount={unreadCount} />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="print-area themed-scroll flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
