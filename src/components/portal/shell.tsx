"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  CalendarClock,
  ChevronsUpDown,
  CreditCard,
  FileText,
  LayoutGrid,
  LifeBuoy,
  LogOut,
  Menu,
  Plus,
  Receipt,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { NotareIcon } from "@/components/brand/logo";
import { logoutClient } from "@/lib/actions/client-auth";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  { label: "Overview", items: [{ href: "/portal/dashboard", label: "Dashboard", icon: LayoutGrid }] },
  {
    label: "Operations",
    items: [
      { href: "/portal/request", label: "Request a Notary", icon: Plus },
      { href: "/portal/appointments", label: "Appointments", icon: CalendarClock },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/portal/billing", label: "Billing", icon: CreditCard },
      { href: "/portal/invoices", label: "Invoices", icon: FileText },
      { href: "/portal/payments", label: "Payments", icon: Receipt },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/portal/profile", label: "Profile", icon: UserRound },
      { href: "/portal/support", label: "Support", icon: LifeBuoy },
    ],
  },
];

export interface ShellAccount {
  displayName: string;
  personName: string;
  email: string;
  initials: string;
  planName: string;
  planActive: boolean;
  canRequest: boolean;
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PortalShell({ account, children }: { account: ShellAccount; children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the drawer whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    if (drawerOpen) setDrawerOpen(false);
  }

  return (
    <div className="portal-root min-h-dvh bg-[#f6f7fb] text-navy-900">
      <a
        href="#portal-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-navy-100 bg-white lg:flex lg:flex-col">
        <SidebarContent account={account} pathname={pathname} />
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-navy-100 bg-white/90 px-3 backdrop-blur supports-[backdrop-filter]:bg-white/80 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          aria-expanded={drawerOpen}
          aria-controls="portal-drawer"
          className="portal-press inline-flex h-10 w-10 items-center justify-center rounded-lg text-navy-700 hover:bg-navy-50"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/portal/dashboard" aria-label="Notar-E portal home" className="absolute left-1/2 -translate-x-1/2">
          <PortalLockup compact />
        </Link>
        <Link
          href="/portal/profile"
          aria-label="Your profile"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white"
        >
          {account.initials}
        </Link>
      </header>

      {drawerOpen && (
        <MobileDrawer account={account} pathname={pathname} onClose={() => setDrawerOpen(false)} />
      )}

      <div className="lg:pl-[248px]">
        <main id="portal-main" className="mx-auto w-full max-w-[1120px] px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pb-16 lg:pt-10">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileTabBar pathname={pathname} canRequest={account.canRequest} onMore={() => setDrawerOpen(true)} />
    </div>
  );
}

/** Compact brand lockup for the portal: mark + wordmark + "Client Portal". */
function PortalLockup({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap">
      <NotareIcon size={compact ? 26 : 30} />
      <span className="flex flex-col leading-none">
        <span className="text-[17px] font-bold tracking-[-0.02em] text-navy-950">
          Notar-E
        </span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent-600">Client Portal</span>
      </span>
    </span>
  );
}

function SidebarContent({ account, pathname, onNavigate }: { account: ShellAccount; pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link href="/portal/dashboard" onClick={onNavigate} aria-label="Notar-E portal home">
          <PortalLockup />
        </Link>
      </div>

      <nav aria-label="Portal" className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mt-5 first:mt-2">
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-navy-400">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items
                .filter((item) => item.href !== "/portal/request" || account.canRequest)
                .map((item) => {
                  const active = isActive(pathname, item.href);
                  const isRequest = item.href === "/portal/request";
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group relative flex h-9 items-center gap-3 rounded-lg px-3 text-[14px] font-medium transition-colors",
                          active ? "bg-navy-50 text-navy-950" : "text-navy-500 hover:bg-navy-50/70 hover:text-navy-900"
                        )}
                      >
                        {active && <span aria-hidden className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-accent-600" />}
                        {isRequest ? (
                          <span
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-md",
                              active ? "bg-accent-600 text-white" : "bg-accent-100 text-accent-700 group-hover:bg-accent-600 group-hover:text-white"
                            )}
                          >
                            <item.icon className="h-3.5 w-3.5" aria-hidden />
                          </span>
                        ) : (
                          <item.icon className={cn("h-[18px] w-[18px]", active ? "text-navy-900" : "text-navy-400 group-hover:text-navy-600")} aria-hidden />
                        )}
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-navy-100 p-3">
        <AccountMenu account={account} onNavigate={onNavigate} />
      </div>
    </>
  );
}

function AccountMenu({ account, onNavigate }: { account: ShellAccount; onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const logout = useLogout();

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {open && (
        <div
          id="portal-account-menu"
          className="portal-enter absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-navy-100 bg-white p-1 shadow-[0_12px_32px_-12px_rgba(10,17,40,0.25)]"
        >
          <div className="px-3 py-2">
            <p className="truncate text-[13px] font-semibold text-navy-900">{account.personName}</p>
            <p className="truncate text-xs text-navy-400">{account.email}</p>
          </div>
          <div className="my-1 h-px bg-navy-100" />
          <Link href="/portal/profile" onClick={() => { setOpen(false); onNavigate?.(); }} className="flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm text-navy-700 hover:bg-navy-50">
            <UserRound className="h-4 w-4 text-navy-400" aria-hidden /> Profile
          </Link>
          <Link href="/portal/billing" onClick={() => { setOpen(false); onNavigate?.(); }} className="flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm text-navy-700 hover:bg-navy-50">
            <CreditCard className="h-4 w-4 text-navy-400" aria-hidden /> Billing
          </Link>
          <button
            type="button"
            onClick={logout.run}
            disabled={logout.pending}
            className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm text-navy-700 hover:bg-navy-50 disabled:opacity-60"
          >
            <LogOut className="h-4 w-4 text-navy-400" aria-hidden /> {logout.pending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="portal-account-menu"
        className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-navy-50"
      >
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-xs font-semibold text-white">
          {account.initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-navy-900">{account.displayName}</span>
          <span className="flex items-center gap-1.5 truncate text-xs text-navy-400">
            <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", account.planActive ? "bg-success-500" : "bg-navy-300")} />
            {account.planName}
          </span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-navy-300" aria-hidden />
      </button>
    </div>
  );
}

function useLogout() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = useCallback(() => {
    start(async () => {
      await logoutClient();
      router.replace("/portal/login");
      router.refresh();
    });
  }, [router]);
  return { run, pending };
}

function MobileDrawer({ account, pathname, onClose }: { account: ShellAccount; pathname: string; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = panelRef.current?.querySelector<HTMLElement>("button, a");
    first?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>("a, button:not([disabled])");
        if (!focusables.length) return;
        const firstEl = focusables[0];
        const lastEl = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
      <div className="portal-scrim absolute inset-0 bg-navy-950/40" onClick={onClose} aria-hidden />
      <div
        id="portal-drawer"
        ref={panelRef}
        className="portal-drawer absolute inset-y-0 left-0 flex w-[86%] max-w-[300px] flex-col bg-white shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-lg text-navy-500 hover:bg-navy-50"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent account={account} pathname={pathname} onNavigate={onClose} />
      </div>
    </div>
  );
}

function MobileTabBar({ pathname, canRequest, onMore }: { pathname: string; canRequest: boolean; onMore: () => void }) {
  const tab = (href: string, label: string, Icon: LucideIcon) => {
    const active = isActive(pathname, href);
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium",
          active ? "text-navy-950" : "text-navy-400"
        )}
      >
        <Icon className={cn("h-5 w-5", active && "text-accent-600")} aria-hidden />
        {label}
      </Link>
    );
  };
  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-navy-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <div className="mx-auto flex h-16 max-w-md items-stretch px-2">
        {tab("/portal/dashboard", "Home", LayoutGrid)}
        {tab("/portal/appointments", "Appointments", CalendarClock)}
        {canRequest ? (
          <div className="flex flex-1 items-center justify-center">
            <Link
              href="/portal/request"
              aria-label="Request a notary"
              className="portal-press -mt-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-600 text-white shadow-[0_8px_20px_-6px_rgba(35,84,235,0.6)] ring-4 ring-[#f6f7fb]"
            >
              <Plus className="h-6 w-6" aria-hidden />
            </Link>
          </div>
        ) : null}
        {tab("/portal/billing", "Billing", CreditCard)}
        <button
          type="button"
          onClick={onMore}
          className="flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-navy-400"
        >
          <Menu className="h-5 w-5" aria-hidden />
          More
        </button>
      </div>
    </nav>
  );
}
