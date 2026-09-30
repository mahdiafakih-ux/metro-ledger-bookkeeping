"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, CalendarDays, Users, Plus, Menu, X, ClipboardList, Kanban, Receipt, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";

const TABS = [
  { href: "/admin/command-center", label: "Today", icon: Compass },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/clients", label: "Clients", icon: Users },
] as const;

const QUICK_ADD_ITEMS = [
  { href: "/admin/appointments/new", label: "New Appointment", icon: ClipboardList },
  { href: "/admin/clients/new", label: "New Client", icon: Users },
  { href: "/admin/pipeline/new", label: "New Lead", icon: Kanban },
  { href: "/admin/expenses", label: "Log Expense", icon: Receipt },
  { href: "/admin/mileage", label: "Log Mileage", icon: Car },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav
        className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-navy-100 bg-white/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-5 items-center">
          {TABS.slice(0, 2).map((tab: any) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                isActive(pathname, tab.href) ? "text-accent-600" : "text-navy-400"
              )}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </Link>
          ))}

          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              aria-label="Quick add"
              className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent-500 text-white shadow-lg shadow-accent-500/30 active:scale-95"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>

          {TABS.slice(2).map((tab: any) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                isActive(pathname, tab.href) ? "text-accent-600" : "text-navy-400"
              )}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </Link>
          ))}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-navy-400"
          >
            <Menu className="h-5 w-5" />
            More
          </button>
        </div>
      </nav>

      {/* Quick add bottom sheet */}
      {quickAddOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setQuickAddOpen(false)} />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 shadow-2xl"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-navy-200" />
            <p className="mb-3 px-1 text-sm font-bold text-navy-900">Quick Add</p>
            <div className="grid grid-cols-2 gap-3">
              {QUICK_ADD_ITEMS.map((item: any) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setQuickAddOpen(false)}
                  className="flex flex-col items-center gap-2 rounded-xl border border-navy-100 bg-navy-50 py-5 text-center text-sm font-semibold text-navy-800 active:bg-navy-100"
                >
                  <item.icon className="h-5 w-5 text-accent-600" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* More menu (full nav) */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMoreOpen(false)} />
          <div className="absolute inset-y-0 left-0">
            <Sidebar onNavigate={() => setMoreOpen(false)} />
          </div>
          <button
            onClick={() => setMoreOpen(false)}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </>
  );
}
