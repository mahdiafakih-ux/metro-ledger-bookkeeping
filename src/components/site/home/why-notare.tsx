import { BadgeCheck, Clock, FileText, Layers } from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";

// Facts only — every number here is a policy or a plan term, not a
// performance claim.
const STATS = [
  { icon: Clock, value: 20, prefix: "~", suffix: " min", label: "Typical appointment" },
  { icon: Layers, value: 2, label: "Ways to notarize: mobile or online" },
  { icon: BadgeCheck, value: 10, prefix: "$", label: "Statutory fee per act, always itemized" },
  { icon: FileText, value: 1, label: "Invoice a month on business plans" },
];

const POINTS = ["Book online, 24/7", "Transparent, itemized pricing", "Client portal for businesses", "Commissioned, bonded & insured"];

export function WhyNotare() {
  return (
    <section className="relative overflow-hidden bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div data-reveal>
          <SectionHeading eyebrow="Why Notar-E" title="Modern notary. Zero guesswork." />
        </div>
        <div data-stagger className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {STATS.map((s) => (
            <div
              key={s.label}
              data-spotlight
              style={{ ["--spot-color" as string]: "rgba(59,107,255,0.10)" }}
              className="spotlight group relative overflow-hidden rounded-3xl border border-navy-100 bg-gradient-to-b from-white to-navy-50/70 p-6 transition-shadow duration-500 hover:shadow-[0_30px_60px_-30px_rgba(35,84,235,0.45)] sm:p-8"
            >
              <s.icon className="h-6 w-6 text-accent-600 transition-transform duration-500 group-hover:-translate-y-0.5" />
              <p className="mt-6 text-4xl font-extrabold tracking-tight text-navy-900 sm:text-5xl">
                <span data-count={s.value} data-prefix={s.prefix ?? ""} data-suffix={s.suffix ?? ""}>
                  {s.prefix ?? ""}
                  {s.value}
                  {s.suffix ?? ""}
                </span>
              </p>
              <p className="mt-2 text-sm leading-snug text-navy-500">{s.label}</p>
            </div>
          ))}
        </div>
        <ul data-stagger className="mt-10 flex flex-wrap justify-center gap-3">
          {POINTS.map((p) => (
            <li key={p} className="rounded-full border border-navy-100 bg-white px-4 py-2 text-sm font-medium text-navy-700 shadow-sm">
              {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
