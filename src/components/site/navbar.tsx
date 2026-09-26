"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, Video, X } from "lucide-react";
import { NotareLogo } from "@/components/brand/logo";
import { LinkButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/services", label: "Services" },
  { href: "/business-solutions", label: "Business" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/careers", label: "Careers" },
  { href: "/contact", label: "Contact" },
];

const MOBILE_EXTRA = [{ href: "/faq", label: "FAQ" }];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock page scroll behind the open mobile menu; Escape closes it.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b bg-white/80 backdrop-blur-xl transition-[box-shadow,border-color] duration-300",
        scrolled ? "border-navy-100 shadow-[0_10px_30px_-20px_rgba(10,17,40,0.35)]" : "border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" onClick={() => setOpen(false)} aria-label="Notar-E Services home">
          <NotareLogo size="md" />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "relative rounded-lg px-3 py-2 text-sm font-medium text-navy-600 transition-colors hover:text-navy-900",
                "after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-accent-500 after:transition-transform after:duration-300 hover:after:scale-x-100",
                isActive(link.href) && "text-navy-900 after:scale-x-100"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/portal/login" className="px-2 text-sm font-medium text-navy-500 hover:text-navy-900">
            Client Login
          </Link>
          <LinkButton href="/book?type=remote" variant="outline" size="md" className="hidden xl:inline-flex">
            <Video className="h-4 w-4" /> Notarize Online
          </LinkButton>
          <LinkButton href="/book" size="md" className="shadow-md shadow-accent-500/25">
            Book a Notary
          </LinkButton>
        </div>

        <button
          type="button"
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-xl text-navy-700 hover:bg-navy-50 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="animate-fade-in-up h-[calc(100dvh-4rem)] overflow-y-auto border-t border-navy-100 bg-white px-4 pb-8 pt-4 lg:hidden">
          <nav aria-label="Mobile" className="flex flex-col">
            {[...LINKS, ...MOBILE_EXTRA].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-3.5 text-base font-semibold text-navy-800 hover:bg-navy-50",
                  isActive(link.href) && "bg-navy-50 text-accent-700"
                )}
              >
                {link.label}
                <ArrowRight className="h-4 w-4 text-navy-300" />
              </Link>
            ))}
            <Link
              href="/portal/login"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-xl px-3 py-3.5 text-base font-medium text-navy-500 hover:bg-navy-50"
            >
              Client Login
            </Link>
          </nav>
          <div className="mt-6 grid gap-3">
            <LinkButton href="/book?type=in_person" size="lg" className="w-full" onClick={() => setOpen(false)}>
              Book a Notary
            </LinkButton>
            <LinkButton href="/book?type=remote" variant="outline" size="lg" className="w-full" onClick={() => setOpen(false)}>
              <Video className="h-4 w-4" /> Notarize Online
            </LinkButton>
          </div>
        </div>
      )}
    </header>
  );
}
