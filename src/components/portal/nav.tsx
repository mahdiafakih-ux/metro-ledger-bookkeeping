"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutClient } from "@/lib/actions/client-auth";
import type { ClientSessionPayload } from "@/lib/client-auth";

export function PortalNav({ session }: { session: ClientSessionPayload }) {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/portal/dashboard" },
    { label: "Appointments", href: "/portal/appointments" },
    { label: "Invoices", href: "/portal/invoices" },
    { label: "Payments", href: "/portal/payments" },
    { label: "Billing", href: "/portal/billing" },
    { label: "Profile", href: "/portal/profile" },
    { label: "Support", href: "/portal/support" },
  ];

  async function handleLogout() {
    await logoutClient();
    window.location.href = "/portal/login";
  }

  const links = (className: string) =>
    navItems.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        aria-current={pathname === item.href ? "page" : undefined}
        className={`${className} rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
          pathname === item.href ? "bg-navy-100 text-navy-900" : "text-navy-700 hover:bg-navy-50"
        }`}
      >
        {item.label}
      </Link>
    ));

  return (
    <nav className="border-b border-navy-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-8">
            <Link href="/portal/dashboard" className="shrink-0 font-bold text-navy-900">
              Notar-E Portal
            </Link>
            <div className="hidden gap-1 lg:flex">{links("px-3 py-2")}</div>
          </div>
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <span className="hidden truncate text-sm text-navy-600 md:inline">{session.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="shrink-0 text-navy-700">
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
      {/* Mobile/tablet: section links scroll horizontally inside their own strip */}
      <div className="border-t border-navy-100 lg:hidden">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
          {links("px-3 py-2")}
        </div>
      </div>
    </nav>
  );
}
