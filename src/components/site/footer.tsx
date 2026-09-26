import Link from "next/link";
import { NotareLogo } from "@/components/brand/logo";

export function Footer() {
  return (
    <footer className="border-t border-navy-100 bg-navy-950 text-navy-200">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <NotareLogo variant="light" size="md" />
            <p className="mt-4 max-w-xs text-sm text-navy-300">
              Michigan-commissioned notary services for individuals and businesses — fast,
              professional, and built for the modern world.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-navy-400">Company</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white">About</Link></li>
              <li><Link href="/services" className="hover:text-white">Services</Link></li>
              <li><Link href="/business-solutions" className="hover:text-white">Business Solutions</Link></li>
              <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-navy-400">Get Started</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/book" className="hover:text-white">Book an Appointment</Link></li>
              <li><Link href="/contact" className="hover:text-white">Become a Business Partner</Link></li>
              <li><Link href="/login" className="hover:text-white">Client Login</Link></li>
              <li><Link href="/admin" className="hover:text-white">Notar-E Command Center</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-navy-400">Legal</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-navy-800 pt-6 text-xs text-navy-400">
          <p>
            Notar-E Services is a Michigan-commissioned notary service. Notar-E Services is not a
            law firm, does not provide legal advice, and cannot advise you on which notarial act or
            document you require. Statutory notarial fees are limited to $10 per notarial act under
            Michigan law (MCL 55.287); any additional charges shown at booking are for lawful,
            separately-disclosed business services such as travel, signing-agent time, or
            administrative handling.
          </p>
          <p className="mt-3">© {new Date().getFullYear()} Notar-E Services. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
