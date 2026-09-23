import { CalendarClock, MapPin, FileCheck2 } from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";

const STEPS = [
  { step: "01", title: "Book Online", icon: CalendarClock, desc: "Choose in-person or remote, pick a time that works, and enter your document details in under two minutes." },
  { step: "02", title: "Meet Your Notary", icon: MapPin, desc: "We come to you, meet you at a convenient location, or connect remotely — appointments take about 20 minutes." },
  { step: "03", title: "Get Notarized", icon: FileCheck2, desc: "Sign, verify ID, and you're done. Receive your confirmation and receipt immediately." },
];

// Small decorative, text-free visuals — one per step.
function StepVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="grid w-fit grid-cols-7 gap-1.5">
        {Array.from({ length: 21 }).map((_, i) => (
          <span
            key={i}
            data-step-pop
            className={i === 10 ? "h-6 w-6 rounded-md bg-accent-500 shadow-md shadow-accent-500/40" : "h-6 w-6 rounded-md bg-navy-50"}
          />
        ))}
      </div>
    );
  }
  if (index === 1) {
    return (
      <div className="flex items-center gap-3">
        <span data-step-pop className="h-12 w-12 rounded-full bg-navy-100 ring-4 ring-white" />
        <span className="h-px w-16 border-t-2 border-dashed border-accent-300" />
        <span data-step-pop className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-500 text-white shadow-lg shadow-accent-500/40">
          <MapPin className="h-5 w-5" />
        </span>
        <span className="h-px w-16 border-t-2 border-dashed border-accent-300" />
        <span data-step-pop className="h-12 w-12 rounded-full bg-navy-900 ring-4 ring-white" />
      </div>
    );
  }
  return (
    <div className="relative w-44 rounded-xl border border-navy-100 bg-white p-4 shadow-sm">
      <div className="space-y-2">
        <span data-step-pop className="block h-2 w-3/4 rounded-full bg-navy-100" />
        <span data-step-pop className="block h-2 w-full rounded-full bg-navy-100" />
        <span data-step-pop className="block h-2 w-1/2 rounded-full bg-navy-100" />
      </div>
      <span data-step-pop className="absolute -bottom-4 -right-4 flex h-11 w-11 items-center justify-center rounded-full bg-accent-500 text-white shadow-lg shadow-accent-500/40">
        <FileCheck2 className="h-5 w-5" />
      </span>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section data-steps className="relative overflow-hidden bg-white">
      <div className="relative mx-auto grid max-w-7xl gap-14 px-4 py-24 sm:px-6 md:min-h-screen md:grid-cols-[0.85fr_1.15fr] md:items-center md:py-0 md:pt-16 lg:px-8">
        <div data-steps-heading>
          <SectionHeading
            align="left"
            eyebrow="How It Works"
            title="Three steps to a notarized document"
            description="No phone tag, no waiting rooms — just a fast, professional appointment when you need it."
          />
          <ol aria-hidden className="relative mt-10 hidden md:block">
            <span className="absolute bottom-6 left-[19px] top-6 w-0.5 rounded-full bg-navy-100" />
            <span data-rail-fill className="absolute bottom-6 left-[19px] top-6 w-0.5 origin-top rounded-full bg-accent-500" />
            {STEPS.map((s) => (
              <li key={s.step} data-rail-node className="relative flex items-center gap-4 py-3">
                <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-navy-100 bg-white text-xs font-bold text-navy-400">
                  <span data-rail-dot className="absolute inset-0 rounded-full bg-accent-500" />
                  <span data-rail-num className="relative text-white">{s.step}</span>
                </span>
                <span data-rail-label className="text-sm font-semibold text-navy-900">
                  {s.title}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div data-steps-stage className="steps-stage relative space-y-6 pl-10 md:pl-0">
          <span data-steps-line aria-hidden className="absolute bottom-0 left-3 top-0 w-0.5 origin-top rounded-full bg-accent-200 md:hidden" />
          {STEPS.map((s, i) => (
            <article
              key={s.step}
              data-step-card
              className="step-card relative overflow-hidden rounded-3xl border border-navy-100 bg-white p-8 shadow-[0_40px_90px_-40px_rgba(10,17,40,0.35)] md:p-10"
            >
              <span aria-hidden className="pointer-events-none absolute -right-2 -top-8 select-none text-[9rem] font-extrabold leading-none text-navy-50">
                {s.step}
              </span>
              <div className="relative flex items-start gap-5">
                <div
                  data-step-icon
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-500 text-white shadow-lg shadow-accent-500/30"
                >
                  <s.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-600">{s.step}</p>
                  <h3 className="mt-1.5 text-2xl font-bold text-navy-900">{s.title}</h3>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-navy-500">{s.desc}</p>
                </div>
              </div>
              <div className="relative mt-9 hidden sm:block">
                <StepVisual index={i} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
