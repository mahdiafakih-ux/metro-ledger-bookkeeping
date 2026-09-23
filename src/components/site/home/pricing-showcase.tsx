import Link from "next/link";
import { SectionHeading } from "@/components/site/section-heading";
import { PricingCard, type PricingPlanView } from "@/components/site/pricing-card";
import { cn } from "@/lib/utils";

// Presentation wrapper only — PricingCard (shared with /pricing) is untouched.
export function PricingShowcase({ plans }: { plans: PricingPlanView[] }) {
  return (
    <section data-pricing className="relative overflow-hidden bg-white py-28">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px] overflow-hidden">
        <div data-pricing-glow className="hero-orb left-1/2 top-[-60%] h-[900px] w-[900px] -translate-x-1/2 [--orb:rgba(59,107,255,0.14)]" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div data-reveal>
          <SectionHeading
            eyebrow="Pricing"
            title="Simple, transparent pricing"
            description="Every price separates the Michigan-limited statutory notarial fee from other lawful service charges."
          />
        </div>
        <div data-pricing-stage className="mt-20 grid gap-8 lg:grid-cols-3 lg:items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.key}
              data-price-card
              data-featured={plan.highlight ? "" : undefined}
              className={cn("relative grid", plan.highlight && "z-10")}
            >
              <div
                data-spotlight
                style={{ ["--spot-color" as string]: plan.highlight ? "rgba(155,182,255,0.14)" : "rgba(59,107,255,0.08)" }}
                className={cn(
                  "price-lift relative grid rounded-3xl",
                  plan.highlight && "price-featured lg:-translate-y-4 lg:scale-[1.035]"
                )}
              >
                {plan.highlight && (
                  <>
                    <span aria-hidden className="price-glow" />
                    <span aria-hidden className="price-ring">
                      <span className="price-ring-spin" />
                    </span>
                  </>
                )}
                <div data-tilt data-tilt-strength="0.3" className="relative z-[1] grid [&>div]:translate-y-0">
                  <PricingCard plan={plan} />
                </div>
                <span aria-hidden className="spot-overlay pointer-events-none absolute inset-0 z-[2] rounded-3xl" />
              </div>
            </div>
          ))}
        </div>
        <div data-reveal className="mt-14 text-center">
          <Link href="/pricing" className="text-sm font-semibold text-accent-600 hover:text-accent-700">
            Full pricing details & comparison →
          </Link>
        </div>
      </div>
    </section>
  );
}
