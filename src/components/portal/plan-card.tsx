import { AlertTriangle, ArrowRight, Infinity as InfinityIcon, Plus, Sparkles } from "lucide-react";
import { isMeteredKind, type PortalAccount } from "@/lib/portal/account";
import { subscriptionStatus } from "@/lib/portal/present";
import { formatCents } from "@/lib/money";
import { formatDetroitDate } from "@/lib/tz";
import { Panel, PortalLink, StatusPill, UsageMeter } from "./ui";

function PeriodNote({ account }: { account: PortalAccount }) {
  const { plan } = account;
  if (plan.periodSource === "stripe") {
    return (
      <>
        Billing period {formatDetroitDate(plan.periodStart, { year: undefined })} –{" "}
        {formatDetroitDate(new Date(plan.periodEnd.getTime() - 1), { year: undefined })}
      </>
    );
  }
  return <>This month · {formatDetroitDate(plan.periodStart, { day: undefined })}</>;
}

/**
 * Current plan card — renders from real account data only.
 * `compact` is used on the dashboard; the billing page uses the full version.
 */
export function PlanCard({ account, showActions = true }: { account: PortalAccount; showActions?: boolean }) {
  const { plan, usage } = account;
  const status = subscriptionStatus(plan.status);

  if (isMeteredKind(plan.kind) && usage && usage.included != null) {
    const over = usage.overage > 0;
    return (
      <Panel className="overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-navy-400">Current plan</p>
              <p className="mt-1.5 text-lg font-semibold tracking-[-0.01em] text-navy-950">{plan.name}</p>
            </div>
            <StatusPill status={status} />
          </div>

          <div className="mt-6 flex items-end justify-between gap-4">
            <p className="tabular text-navy-950">
              <span className="text-[40px] font-semibold leading-none tracking-[-0.03em]">{usage.used}</span>
              <span className="text-lg font-medium text-navy-400"> / {usage.included}</span>
            </p>
            <p className="pb-1 text-right text-[13px] text-navy-500">
              {over ? (
                <span className="font-semibold text-warning-600">{usage.overage} over included</span>
              ) : (
                <>
                  <span className="tabular font-semibold text-navy-900">{usage.remaining}</span> remaining
                </>
              )}
            </p>
          </div>
          <p className="mt-1 text-[13px] text-navy-500">notarizations this billing period</p>

          <div className="mt-4">
            <UsageMeter used={usage.used} included={usage.included} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-navy-400">
            <span className="tabular">{usage.percent ?? 0}% utilized</span>
            <span>
              <PeriodNote account={account} />
            </span>
          </div>

          {over && (
            <div className="mt-4 flex gap-3 rounded-lg border border-warning-100 bg-warning-100/50 p-3 text-[13px] text-warning-600">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>
                <span className="font-semibold">
                  {usage.overage} additional notarization{usage.overage === 1 ? "" : "s"}
                </span>
                {usage.estimatedOverageCents != null && plan.overageFeeCents != null ? (
                  <>
                    {" "}· estimated {formatCents(usage.estimatedOverageCents)} at {formatCents(plan.overageFeeCents)} each.
                    Additional notarizations are reviewed and invoiced separately — never charged automatically.
                  </>
                ) : (
                  <> beyond your included amount. We&apos;ll contact you about any additional charges.</>
                )}
              </p>
            </div>
          )}
        </div>
        <PlanFooter account={account} showActions={showActions} />
      </Panel>
    );
  }

  if (plan.kind === "unlimited") {
    return (
      // Not <Panel>: cn() is clsx (no tailwind-merge), so Panel's bg-white would win.
      <section className="relative overflow-hidden rounded-xl border border-navy-900 bg-navy-950 text-white shadow-[0_1px_2px_rgba(10,17,40,0.04)]">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-accent-600/25 blur-3xl" />
        <div className="relative p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-navy-300">Current plan</p>
              <p className="mt-1.5 flex items-center gap-2 text-lg font-semibold tracking-[-0.01em]">
                {plan.name}
                <Sparkles className="h-4 w-4 text-accent-300" aria-hidden />
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-white ring-1 ring-inset ring-white/15">
              <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${status.tone === "green" ? "bg-success-500" : "bg-warning-500"}`} />
              {status.label}
            </span>
          </div>
          <div className="mt-6 flex items-end gap-3">
            <p className="tabular text-[40px] font-semibold leading-none tracking-[-0.03em]">{usage?.used ?? 0}</p>
            <p className="pb-1 text-[13px] text-navy-300">notarizations this period</p>
          </div>
          <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-[13px] text-navy-100 ring-1 ring-inset ring-white/10">
            <InfinityIcon className="h-4 w-4 text-accent-300" aria-hidden /> Unlimited qualifying appointments
          </p>
          <p className="mt-3 text-xs text-navy-300">
            This plan has been discontinued for new customers. Your subscription continues unchanged; your account owner can
            switch to Business10 or Business30 from Billing.
          </p>
          <p className="mt-3 text-xs text-navy-300">
            <PeriodNote account={account} />
          </p>
        </div>
        <PlanFooter account={account} showActions={showActions} dark />
      </section>
    );
  }

  // Pay-as-you-go (and any unrecognized legacy plan key)
  return (
    <Panel className="overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-navy-400">Current plan</p>
            <p className="mt-1.5 text-lg font-semibold tracking-[-0.01em] text-navy-950">
              {plan.kind === "payg" ? "Pay As You Go" : plan.name}
            </p>
          </div>
          {plan.kind !== "payg" && <StatusPill status={status} />}
        </div>
        {plan.kind === "payg" && plan.priceCents != null ? (
          <>
            <p className="mt-6 tabular text-navy-950">
              <span className="text-[34px] font-semibold leading-none tracking-[-0.03em]">
                {formatCents(plan.priceCents, { showCents: plan.priceCents % 100 !== 0 })}
              </span>
              <span className="text-sm font-medium text-navy-400"> / appointment</span>
            </p>
            {plan.statutoryFeeCents != null && plan.serviceFeeCents != null && (
              <p className="mt-2 text-[13px] leading-relaxed text-navy-500">
                {formatCents(plan.statutoryFeeCents)} Michigan statutory notarial fee per notarial act, plus a separately
                disclosed {plan.serviceFeeLabel.toLowerCase() || "service fee"} of {formatCents(plan.serviceFeeCents)}. Shown
                total is for one notarial act.
              </p>
            )}
          </>
        ) : (
          <p className="mt-4 text-sm text-navy-500">Pay for each appointment as you go. No subscription required.</p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-navy-100 bg-navy-50/50 px-5 py-3.5 sm:px-6">
        <p className="text-[13px] text-navy-500">Need a notary often? See Business10 &amp; Business30.</p>
        {showActions && (
          <PortalLink href="/portal/request" size="sm">
            <Plus className="h-4 w-4" aria-hidden /> Request a Notary
          </PortalLink>
        )}
      </div>
    </Panel>
  );
}

function PlanFooter({ account, showActions, dark }: { account: PortalAccount; showActions: boolean; dark?: boolean }) {
  const { plan } = account;
  return (
    <div
      className={
        dark
          ? "relative flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-3.5 sm:px-6"
          : "flex flex-wrap items-center justify-between gap-3 border-t border-navy-100 bg-navy-50/50 px-5 py-3.5 sm:px-6"
      }
    >
      <p className={dark ? "text-[13px] text-navy-300" : "text-[13px] text-navy-500"}>
        {plan.nextBillingDate ? (
          <>
            Next billing{" "}
            <span className={dark ? "font-semibold text-white" : "font-semibold text-navy-900"}>
              {formatDetroitDate(plan.nextBillingDate)}
            </span>
          </>
        ) : plan.priceCents != null && plan.billingPeriod === "monthly" ? (
          <>
            <span className={dark ? "font-semibold text-white" : "font-semibold text-navy-900"}>
              {formatCents(plan.priceCents, { showCents: false })}
            </span>{" "}
            / month
          </>
        ) : (
          "Monthly plan"
        )}
      </p>
      {showActions && (
        <PortalLink
          href="/portal/billing"
          size="sm"
          variant={dark ? "primary" : "secondary"}
        >
          Billing <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </PortalLink>
      )}
    </div>
  );
}
