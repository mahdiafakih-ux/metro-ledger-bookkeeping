"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NotareLogo } from "@/components/brand/logo";
import { LinkButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/services", label: "Services", highlight: false },
  { href: "/book", label: "Notarize Online", highlight: true },
  { href: "/business-solutions", label: "Business Solutions", highlight: false },
  { href: "/pricing", label: "Pricing", highlight: false },
  { href: "/about", label: "About", highlight: false },
  { href: "/faq", label: "FAQ", highlight: false },
  { href: "/contact", label: "Contact", highlight: false },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-navy-100 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" onClick={() => setOpen(false)}>
          <NotareLogo size="md" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                link.highlight
                  ? "bg-accent-100 text-accent-700 hover:bg-accent-200 hover:text-accent-800"
                  : "text-navy-600 hover:bg-navy-50 hover:text-navy-900",
                pathname === link.href && !link.highlight && "bg-navy-50 text-navy-900",
                pathname === link.href && link.highlight && "bg-accent-200 text-accent-800"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="text-sm font-medium text-navy-500 hover:text-navy-900">
            Client Login
          </Link>
          <LinkButton href="/book" size="md">
            Book a Notary
          </LinkButton>
        </div>

        <button
          className="p-2 text-navy-700 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-navy-100 bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium",
                  link.highlight
                    ? "bg-accent-100 text-accent-700 hover:bg-accent-200"
                    : "text-navy-700 hover:bg-navy-50"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50"
            >
              Client Login
            </Link>
          </nav>
          <LinkButton href="/book" size="md" className="mt-3 w-full">
            Book a Notary
          </LinkButton>
        </div>
      )}
    </header>
  );
}
