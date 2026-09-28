import { ArrowRight, Building2 } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { ENTERPRISE_OFFER } from "@/lib/plans";
import { cn } from "@/lib/utils";

/**
 * Enterprise is a custom-quote offer (~50+ notarizations/month). It is not a
 * self-serve plan, has no Stripe price, and is never unlimited.
 */
export function EnterpriseCallout({ className }: { className?: string }) {
  return (
    <div
      data-testid="enterprise-callout"
      className={cn(
        "flex flex-col gap-5 rounded-3xl border border-navy-100 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(10,17,40,0.35)] sm:flex-row sm:items-center sm:justify-between sm:p-8",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-white">
          <Building2 className="h-5 w-5" />
        </span>
        <div>
          <p className="text-lg font-bold text-navy-900">
            {ENTERPRISE_OFFER.name} <span className="ml-1 text-sm font-semibold text-navy-500">· Custom quote</span>
          </p>
          <p className="mt-1 text-sm text-navy-500">
            For organizations with roughly {ENTERPRISE_OFFER.suggestedMinMonthlyNotarizations}+ notarizations a month. Pricing is
            quoted to your volume; statutory notarial fees are always itemized separately.
          </p>
        </div>
      </div>
      <LinkButton href={ENTERPRISE_OFFER.ctaHref} variant="dark" className="shrink-0">
        Request a quote <ArrowRight className="h-4 w-4" />
      </LinkButton>
    </div>
  );
}
