import { ArrowRight, Video } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

export function CtaBanner() {
  return (
    <section data-cta className="relative isolate overflow-hidden bg-white">
      <div data-cta-bg aria-hidden className="absolute inset-0 -z-10 overflow-hidden bg-accent-600">
        <div data-cta-orb className="hero-orb left-[-10%] top-[-60%] h-[640px] w-[640px] [--orb:rgba(255,255,255,0.18)]" />
        <div className="hero-orb bottom-[-70%] right-[-5%] h-[640px] w-[640px] [--orb:rgba(5,9,20,0.25)]" />
      </div>
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-24 text-center sm:px-6 lg:px-8">
        <h2 data-cta-headline className="text-3xl font-bold text-white sm:text-4xl">
          Ready when you are.
        </h2>
        <p data-cta-sub className="text-accent-100">Book in under two minutes.</p>
        <div data-cta-button className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <span data-magnetic className="inline-block w-full sm:w-auto">
            <LinkButton
              href="/book?type=in_person"
              variant="dark"
              size="lg"
              className="btn-spot group relative w-full overflow-hidden bg-white text-accent-700 shadow-xl shadow-navy-950/20 hover:bg-navy-50 sm:w-auto"
            >
              <span data-magnetic-inner className="relative z-10 inline-flex items-center gap-2 text-accent-700">
                Book a Notary <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </span>
              <span aria-hidden className="btn-sheen btn-sheen-dark" />
            </LinkButton>
          </span>
          <span data-magnetic className="inline-block w-full sm:w-auto">
            <LinkButton
              href="/book?type=remote"
              variant="outline"
              size="lg"
              className="btn-spot relative w-full overflow-hidden border-white/40 text-white hover:bg-white/10 sm:w-auto"
            >
              <span data-magnetic-inner className="relative z-10 inline-flex items-center gap-2">
                <Video className="h-4 w-4" /> Notarize Online
              </span>
            </LinkButton>
          </span>
        </div>
      </div>
    </section>
  );
}
