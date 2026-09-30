import { Zap, ShieldCheck, CalendarClock, FileSignature, Building2 } from "lucide-react";

const TRUST_ITEMS = [
  { icon: Zap, label: "Fast Appointments", sub: "~20 minutes, on your schedule" },
  { icon: ShieldCheck, label: "Michigan Commissioned", sub: "Bonded & insured notary" },
  { icon: CalendarClock, label: "Convenient Scheduling", sub: "Book online in minutes" },
  { icon: FileSignature, label: "Secure Service", sub: "Confidential document handling" },
  { icon: Building2, label: "Individual & Business", sub: "Solutions for every client" },
];

// Frosted panel that overlaps the bottom of the hero — the seam between the
// dark hero and the light page.
export function TrustBar() {
  return (
    <section className="relative z-10 -mt-20 px-4 sm:px-6 lg:px-8">
      <div
        data-trust
        className="mx-auto grid max-w-6xl grid-cols-2 gap-6 rounded-3xl border border-white/70 bg-white/85 px-6 py-10 shadow-[0_40px_100px_-40px_rgba(10,17,40,0.45)] backdrop-blur-xl md:grid-cols-5 md:px-10"
      >
        {TRUST_ITEMS.map((item) => (
          <div key={item.label} data-trust-item className="group flex flex-col items-center gap-2 text-center">
            <div
              data-trust-tile
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-100 text-accent-600 transition-[background-color,box-shadow] duration-300 group-hover:bg-accent-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-accent-500/30"
            >
              <item.icon className="h-5 w-5 transition-transform duration-500 group-hover:-translate-y-0.5" />
            </div>
            <p className="text-sm font-semibold text-navy-900">{item.label}</p>
            <p className="text-xs text-navy-400">{item.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
