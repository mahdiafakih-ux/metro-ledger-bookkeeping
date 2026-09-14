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

  return (
    <nav className="border-b border-navy-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/portal/dashboard" className="font-bold text-navy-900">
              Notar-E Portal
            </Link>
            <div className="flex gap-1">
              {navItems.map((item: any) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-navy-100 text-navy-900"
                      : "text-navy-700 hover:bg-navy-50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-navy-600">{session.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-navy-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
