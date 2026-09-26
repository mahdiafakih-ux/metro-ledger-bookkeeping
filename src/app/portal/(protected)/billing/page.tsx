import Link from "next/link";
import { ArrowRight, Building2, FileText, Lock, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { getPortalAccount, invoiceScope, isMeteredKind, isSubscriptionKind } from "@/lib/portal/account";
import { PlanPicker } from "@/components/portal/plan-picker";
import { getOutstanding } from "@/lib/portal/queries";
import { invoiceStatus, invoiceTotals, subscriptionStatus, sentence } from "@/lib/portal/present";
import { isStripeConfigured } from "@/lib/stripe";
import { getBusinessSettings } from "@/lib/settings";
import { formatCents } from "@/lib/money";
import { formatDateOnly, formatDetroitDate } from "@/lib/tz";
import { PlanCard } from "@/components/portal/plan-card";
import { BillingPortalButton } from "@/components/portal/billing-client";
import { EmptyState, KeyValue, PageHeader, Panel, PanelHeader, PortalLink, StatusPill } from "@/components/portal/ui";

export const metadata = { title: "Billing" };

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ cancelled?: string; session_id?: string }> }) {
  const sp = await searchParams;
  const account = await getPortalAccount();
  const { plan, usage } = account;
  const [outstanding, recent, settings] = await Promise.all([
    getOutstanding(account),
    prisma.invoice.findMany({
      where: invoiceScope(account),
      orderBy: { issueDate: "desc" },
      take: 5,
      include: { items: { select: { amountCents: true } } },
    }),
    getBusinessSettings(),
  ]);

  const isSubscription = isSubscriptionKind(plan.kind);
  // Business owners/admins choose or switch Business10 / Business30 here.
  const businessRow =
    account.business && account.canViewBusiness
      ? await prisma.business.findUnique({
          where: { id: account.business.id },
          select: { currentPlanKey: true, stripeSubscriptionId: true, subscriptionStatus: true },
        })
      : null;
  const hasActiveSubscription =
    !!businessRow?.stripeSubscriptionId && ["active", "past_due", "incomplete", "trialing"].includes(businessRow.subscriptionStatus);
  const canOpenStripe = isStripeConfigured() && plan.hasStripeCustomer && account.canManageBilling;

  return (
    <div className="portal-enter space-y-6">
      <PageHeader
        title="Billing"
        description={account.plan.owner === "business" ? `Plan and billing for ${sentence(account.business?.companyName ?? "")}` : "Your plan, balance and billing settings."}
      />

      {sp.session_id && (
        <p className="rounded-lg border border-success-100 bg-success-100/60 px-4 py-3 text-sm font-medium text-success-600">
          Payment received — your plan activates as soon as Stripe confirms it (usually within a minute).
        </p>
      )}
      {sp.cancelled === "true" && (
        <p className="rounded-lg border border-navy-100 bg-white px-4 py-3 text-sm text-navy-600">Checkout was cancelled — nothing was charged.</p>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <PlanCard account={account} showActions={false} />

          {isSubscription && (
            <Panel>
              <PanelHeader title="Subscription details" />
              <dl className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
                <KeyValue label="Plan">{plan.name}</KeyValue>
                <KeyValue label="Status">
                  <StatusPill status={subscriptionStatus(plan.status)} />
                </KeyValue>
                <KeyValue label="Monthly price">
                  {plan.priceCents != null ? <span className="tabular">{formatCents(plan.priceCents)}</span> : "—"}
                </KeyValue>
                <KeyValue label="Next billing date">{plan.nextBillingDate ? formatDetroitDate(plan.nextBillingDate) : "—"}</KeyValue>
                <KeyValue label="Usage this period">
                  <span className="tabular">
                    {usage ? (usage.included != null ? `${usage.used} of ${usage.included}` : `${usage.used} · unlimited`) : "—"}
                  </span>
                </KeyValue>
                <KeyValue label="Additional notarizations">
                  {isMeteredKind(plan.kind) && usage ? (
                    usage.overage > 0 ? (
                      <span className="tabular text-warning-600">
                        {usage.overage}
                        {usage.estimatedOverageCents != null && ` · est. ${formatCents(usage.estimatedOverageCents)}`}
                      </span>
                    ) : (
                      "None"
                    )
                  ) : (
                    "Not applicable"
                  )}
                </KeyValue>
              </dl>
              {isMeteredKind(plan.kind) && plan.overageFeeCents != null && (
                <p className="border-t border-navy-100 px-5 py-3 text-[13px] text-navy-500">
                  Notarizations beyond the {plan.included} included each billing month are {formatCents(plan.overageFeeCents, { showCents: false })} each.
                  Additional notarizations are reviewed and invoiced separately — they are never charged automatically.
                </p>
              )}
            </Panel>
          )}

          {account.business && account.canViewBusiness && businessRow && isStripeConfigured() && (
            <Panel>
              <PanelHeader title={hasActiveSubscription ? "Change plan" : "Choose a business plan"} />
              <div className="p-5">
                <PlanPicker
                  businessId={account.business.id}
                  currentPlanKey={businessRow.currentPlanKey}
                  hasActiveSubscription={hasActiveSubscription}
                />
              </div>
            </Panel>
          )}

          <Panel>
            <PanelHeader
              title="Recent invoices"
              action={
                <Link href="/portal/invoices" className="text-[13px] font-semibold text-accent-700 hover:text-accent-600">
                  View all
                </Link>
              }
            />
            {recent.length ? (
              <ul className="divide-y divide-navy-100">
                {recent.map((inv) => {
                  const { total, balance } = invoiceTotals(inv);
                  return (
                    <li key={inv.id}>
                      <Link href={`/invoice/${inv.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-navy-50/60">
                        <FileText className="h-4 w-4 shrink-0 text-navy-400" aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className="tabular block text-sm font-semibold text-navy-900">{inv.invoiceNumber}</span>
                          <span className="block text-xs text-navy-500">Issued {formatDateOnly(inv.issueDate)}</span>
                        </span>
                        <span className="text-right">
                          <span className="tabular block text-sm font-semibold text-navy-950">{formatCents(total)}</span>
                          {balance > 0 && inv.status !== "cancelled" && (
                            <span className="tabular block text-xs text-navy-500">{formatCents(balance)} due</span>
                          )}
                        </span>
                        <StatusPill status={invoiceStatus(inv)} className="hidden sm:inline-flex" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState compact icon={FileText} title="You're all caught up." description="Invoices will appear here once they're generated." />
            )}
          </Panel>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Panel>
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-navy-400">Outstanding balance</p>
              <p className={`tabular mt-2 text-[32px] font-semibold leading-none tracking-[-0.03em] ${outstanding.balanceCents > 0 ? "text-navy-950" : "text-navy-400"}`}>
                {formatCents(outstanding.balanceCents)}
              </p>
              <p className="mt-2 text-[13px] text-navy-500">
                {outstanding.count > 0
                  ? `${outstanding.count} unpaid invoice${outstanding.count === 1 ? "" : "s"}`
                  : "Nothing due right now."}
              </p>
              {outstanding.count > 0 && (
                <PortalLink href="/portal/invoices" className="mt-4 w-full">
                  Review & pay <ArrowRight className="h-4 w-4" aria-hidden />
                </PortalLink>
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Payment method & subscription" />
            <div className="space-y-4 p-5">
              {canOpenStripe ? (
                <>
                  <p className="text-sm text-navy-600">
                    Update your card, download receipts{isSubscription ? ", and manage or cancel your subscription" : ""} in our secure
                    Stripe billing portal.
                  </p>
                  <BillingPortalButton label="Manage billing" variant="dark" className="w-full" />
                  <p className="flex items-start gap-2 text-xs text-navy-400">
                    <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    Card details are stored by Stripe and never touch Notar-E&apos;s servers.
                  </p>
                </>
              ) : account.plan.owner === "business" && !account.canManageBilling ? (
                <p className="text-sm text-navy-600">
                  Billing for {account.business?.companyName} is managed by your account owner or admin.
                </p>
              ) : (
                <p className="text-sm text-navy-600">
                  No saved payment method yet. You can pay each invoice or appointment securely online by card. Need to set up
                  billing? Contact us at{" "}
                  <a href={`mailto:${settings.email}`} className="font-semibold text-accent-700">
                    {settings.email}
                  </a>
                  .
                </p>
              )}
            </div>
          </Panel>

          {!isSubscription && (
            <Panel className="p-5">
              <div className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-white">
                  <Building2 className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-navy-950">Need notaries every month?</p>
                  <p className="mt-1 text-[13px] text-navy-500">
                    Business10 and Business30 include monthly notarizations, one monthly invoice and a shared preferred-notary team.
                  </p>
                  <Link href="/business-solutions" className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-accent-700 hover:text-accent-600">
                    Explore business plans <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
              </div>
            </Panel>
          )}

          <p className="flex items-start gap-2 px-1 text-xs text-navy-400">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Michigan statutory notarial fees are always itemized separately from any other service charges.
          </p>
        </div>
      </div>
    </div>
  );
}
