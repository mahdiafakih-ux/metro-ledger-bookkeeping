import { ArrowRight, Car, CheckCircle2, Lock, MapPin, ShieldCheck, Video } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { SectionHeading } from "@/components/site/section-heading";

/**
 * Mobile vs. Remote Online Notarization — the two core ways to use Notar-E.
 * Compliance: online is only described as available for eligible documents
 * and transactions, and BlueNotary is named as a third-party platform we use
 * (no partnership, ownership or endorsement implied).
 */
export function TwoWays() {
  return (
    <section data-ways className="relative overflow-hidden bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div data-reveal>
          <SectionHeading eyebrow="Two ways to notarize" title="In person or online. Same notary." />
        </div>

        <div className="relative mt-14 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Mobile */}
          <article
            data-way-card
            data-spotlight
            style={{ ["--spot-color" as string]: "rgba(59,107,255,0.08)" }}
            className="spotlight group relative flex flex-col overflow-hidden rounded-[2rem] border border-navy-100 bg-gradient-to-b from-white to-navy-50 p-7 sm:p-10"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 text-white shadow-lg shadow-navy-900/20 transition-transform duration-500 group-hover:-rotate-6">
                <Car className="h-6 w-6" />
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent-600">Mobile Notary</span>
            </div>
            <h3 className="mt-6 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">We come to you.</h3>
            <p className="mt-3 max-w-sm text-navy-500">Home, office, hospital, closing table.</p>

            {/* Mini route visual */}
            <div aria-hidden className="relative my-8 flex items-center gap-3">
              <span className="h-11 w-11 rounded-full bg-navy-100 ring-4 ring-white" />
              <span className="h-0.5 flex-1 border-t-2 border-dashed border-accent-300" />
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-500 text-white shadow-lg shadow-accent-500/40">
                <MapPin className="h-5 w-5" />
              </span>
              <span className="h-0.5 flex-1 border-t-2 border-dashed border-accent-300" />
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-900 text-white ring-4 ring-white">
                <CheckCircle2 className="h-5 w-5" />
              </span>
            </div>

            <ul className="space-y-2.5 text-sm text-navy-600">
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-accent-600" /> Metro Detroit &amp; Southeast Michigan</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-accent-600" /> Travel fee agreed before we travel</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-accent-600" /> Loan signings &amp; real estate packages</li>
            </ul>
            <div className="mt-auto pt-8">
              <LinkButton href="/book?type=in_person" variant="dark" size="lg" className="group/btn w-full sm:w-auto">
                Book a Mobile Notary <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
              </LinkButton>
            </div>
          </article>

          {/* "or" connector (desktop) */}
          <span
            data-way-or
            aria-hidden
            className="absolute left-1/2 top-1/2 z-10 hidden h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white bg-accent-500 text-sm font-bold uppercase text-white shadow-xl shadow-accent-500/40 lg:flex"
          >
            or
          </span>

          {/* Online */}
          <article
            data-way-card
            data-spotlight
            style={{ ["--spot-color" as string]: "rgba(155,182,255,0.14)" }}
            className="spotlight group relative flex flex-col overflow-hidden rounded-[2rem] border border-navy-800 bg-navy-950 p-7 text-white sm:p-10"
          >
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="hero-grid absolute inset-0 opacity-60" />
              <div className="hero-orb -right-24 -top-24 h-80 w-80 [--orb:rgba(59,107,255,0.45)]" />
            </div>
            <div className="relative flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-500 text-white shadow-lg shadow-accent-500/40 transition-transform duration-500 group-hover:rotate-6">
                <Video className="h-6 w-6" />
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent-300">Remote Online Notarization</span>
            </div>
            <h3 className="relative mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Notarize <span className="text-gradient">online.</span>
            </h3>
            <p className="relative mt-3 max-w-sm text-navy-200">Secure video session. No driving, no waiting.</p>

            {/* Mini session visual */}
            <div aria-hidden className="relative my-8 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-navy-300">
                <span data-live-dot className="live-dot h-2 w-2 rounded-full bg-success-500" /> Live session
                <Lock className="ml-auto h-3.5 w-3.5" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="flex aspect-video items-center justify-center rounded-xl bg-navy-800">
                  <span className="h-8 w-8 rounded-full bg-navy-600" />
                </div>
                <div className="flex aspect-video items-center justify-center rounded-xl bg-navy-800">
                  <span className="h-8 w-8 rounded-full bg-accent-500/70" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <span className="block h-full w-3/4 rounded-full bg-accent-400" />
                </span>
                <ShieldCheck className="h-4 w-4 text-accent-300" />
              </div>
            </div>

            <ul className="relative space-y-2.5 text-sm text-navy-200">
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-accent-300" /> Identity verified during the session</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-accent-300" /> Sign from anywhere with a camera</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-accent-300" /> Eligible documents &amp; transactions only</li>
            </ul>
            <div className="relative mt-auto pt-8">
              <LinkButton href="/book?type=remote" size="lg" className="group/btn w-full shadow-lg shadow-accent-500/30 sm:w-auto">
                Notarize Online <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
              </LinkButton>
              <p className="mt-4 text-[11px] leading-relaxed text-navy-400">
                Remote online notarization is available for eligible documents and transactions. Sessions are conducted on
                BlueNotary, a third-party platform; Notar-E Services is independent and not affiliated with or endorsed by BlueNotary.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
