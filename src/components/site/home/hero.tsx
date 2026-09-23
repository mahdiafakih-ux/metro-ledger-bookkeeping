import { ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { NotareIcon } from "@/components/brand/logo";
import { HeroBackground } from "./hero-background";
import { HeroDocument } from "./hero-document";

export function HomeHero({
  serviceArea,
  headline,
  subheadline,
}: {
  serviceArea: string;
  headline: string;
  subheadline: string;
}) {
  return (
    <section data-hero className="relative isolate overflow-hidden bg-navy-950">
      <HeroBackground />
      <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-center gap-10 px-4 pb-32 pt-16 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:pb-40">
        <div data-hero-content className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
          <div data-hero-mouse-content>
            <div data-hero-item="icon" className="relative mb-7 inline-flex">
              <svg data-hero-ring aria-hidden viewBox="0 0 100 100" className="hero-ring pointer-events-none absolute -inset-4 h-[calc(100%+2rem)] w-[calc(100%+2rem)]" fill="none">
                <circle cx="50" cy="50" r="47" pathLength={1} stroke="#6690ff" strokeWidth="1.5" className="doc-stroke" />
              </svg>
              <span data-hero-pulse aria-hidden className="pointer-events-none absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full bg-accent-400/60 opacity-0" />
              <span data-hero-badge className="block">
                <NotareIcon size={60} />
              </span>
            </div>

            <p data-hero-item="eyebrow" className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-accent-300">
              {serviceArea}
            </p>

            <div className="relative">
              <h1
                data-hero-headline
                className="hero-headline text-[2.6rem] font-extrabold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-[4.4rem]"
              >
                {headline}
              </h1>
              <svg
                data-hero-underline
                aria-hidden
                viewBox="0 0 200 12"
                preserveAspectRatio="none"
                className="hero-underline pointer-events-none absolute left-0 top-0 h-3 w-0 overflow-visible"
                fill="none"
              >
                <path d="M2 8C50 2 140 1 198 6" pathLength={1} stroke="#6690ff" strokeWidth="3" strokeLinecap="round" className="doc-stroke" />
              </svg>
            </div>

            <p data-hero-sub className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-navy-200 sm:text-xl lg:mx-0">
              {subheadline}
            </p>

            <div
              data-hero-item="cta"
              className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start"
            >
              <span data-magnetic className="inline-block w-full sm:w-auto">
                <LinkButton
                  href="/book"
                  size="lg"
                  className="btn-spot group relative w-full overflow-hidden shadow-lg shadow-accent-500/30 sm:w-auto"
                >
                  <span data-magnetic-inner className="relative z-10 inline-flex items-center gap-2">
                    Book an Appointment <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                  <span data-sheen aria-hidden className="btn-sheen" />
                </LinkButton>
              </span>
              <span data-magnetic className="inline-block w-full sm:w-auto">
                <LinkButton
                  href="/business-solutions"
                  variant="outline"
                  size="lg"
                  className="btn-spot relative w-full overflow-hidden border-white/20 text-white backdrop-blur-sm hover:bg-white/10 sm:w-auto"
                >
                  <span data-magnetic-inner className="relative z-10 inline-flex items-center gap-2">
                    Business Solutions
                  </span>
                </LinkButton>
              </span>
            </div>
          </div>
        </div>

        <HeroDocument />
      </div>
    </section>
  );
}
