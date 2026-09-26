import { ArrowRight, CheckCircle2 } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { SectionHeading } from "@/components/site/section-heading";
import { formatCents } from "@/lib/money";
import { SUBSCRIPTION_PLAN_LIST } from "@/lib/plans";

const BENEFITS = [
  "One monthly invoice",
  "Live usage in your client portal",
  "Mobile + eligible online notarization",
  "Predictable base price",
  "Switch plans anytime",
];

const money = (c: number) => formatCents(c, { showCents: false });
const PLAN_ROWS = SUBSCRIPTION_PLAN_LIST.map((p) => ({
  label: p.name,
  desc: `${p.includedNotarizations} notarizations included · ${money(p.overagePerNotarizationCents)} each after`,
  price: `${money(p.monthlyCents)}/mo`,
}));

export function BusinessSection() {
  return (
    <section data-biz className="relative isolate overflow-hidden bg-navy-50">
      <div data-biz-bg aria-hidden className="absolute inset-0 -z-10 bg-navy-950" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div data-biz-glow className="hero-orb right-[-10%] top-[10%] h-[760px] w-[760px] opacity-60 [--orb:rgba(59,107,255,0.35)]" />
        <div className="hero-grid absolute inset-0 opacity-50" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-28 sm:px-6 lg:min-h-screen lg:grid-cols-2 lg:px-8 lg:py-0 lg:pt-16">
        <div>
          <div data-biz-heading>
            <SectionHeading
              align="left"
              light
              eyebrow="For Businesses"
              title="Your On-Demand Notary Partner"
              description="Stop searching for a notary every time. Pick a monthly plan."
            />
          </div>
          <ul data-biz-list className="relative mt-9 space-y-1">
            <span data-biz-marker aria-hidden className="absolute left-0 top-0 hidden h-11 w-[3px] rounded-full bg-accent-400 opacity-0 shadow-[0_0_16px_rgba(102,144,255,0.9)] lg:block" />
            {BENEFITS.map((f) => (
              <li key={f} data-biz-item className="flex items-center gap-3 py-2.5 pl-5 text-base text-navy-100 lg:text-lg">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-accent-400" />
                {f}
              </li>
            ))}
          </ul>
          <div data-biz-cta className="mt-9">
            <span data-magnetic className="inline-block">
              <LinkButton href="/business-solutions" size="lg" className="btn-spot group relative overflow-hidden shadow-lg shadow-accent-500/30">
                <span data-magnetic-inner className="relative z-10 inline-flex items-center gap-2">
                  Explore Business Solutions <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </LinkButton>
            </span>
          </div>
        </div>

        <div className="[perspective:1400px]">
          <div
            data-biz-panel
            className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-navy-800/80 to-navy-900/80 p-8 shadow-[0_60px_140px_-40px_rgba(59,107,255,0.5)] backdrop-blur-md sm:p-10"
          >
            <div aria-hidden className="mb-8 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-navy-600" />
              <span className="h-2.5 w-2.5 rounded-full bg-navy-600" />
              <span className="h-2.5 w-2.5 rounded-full bg-accent-400" />
              <span className="ml-auto h-2 w-24 rounded-full bg-white/10" />
            </div>
            <div className="space-y-4">
              {PLAN_ROWS.map((p) => (
                <div
                  key={p.label}
                  data-biz-row
                  data-spotlight
                  style={{ ["--spot-color" as string]: "rgba(155,182,255,0.12)" }}
                  className="spotlight relative overflow-hidden rounded-2xl border border-white/5 bg-navy-800/90 p-6 transition-colors duration-300 hover:border-accent-400/40"
                >
                  <div className="relative z-10 flex items-center justify-between gap-4">
                    <p className="text-lg font-semibold text-white">{p.label}</p>
                    <p className="text-lg font-bold text-accent-300">{p.price}</p>
                  </div>
                  <p className="relative z-10 mt-1 text-sm text-navy-300">{p.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-[11px] text-navy-400">
              Each notarization includes the $10 Michigan statutory notarial fee (MCL 55.285), itemized on every invoice.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
