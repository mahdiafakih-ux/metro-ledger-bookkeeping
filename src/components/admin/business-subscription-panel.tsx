"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, ExternalLink, Loader2, Receipt, RefreshCw, Repeat, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/form";
import { formatCents } from "@/lib/money";
import { SUBSCRIPTION_PLAN_LIST, planDisplayName, isLegacyPlanKey, isSubscriptionPlanKey } from "@/lib/plans";
import {
  changeBusinessPlanAdmin,
  createBusinessCheckoutLink,
  invoiceBusinessOverage,
  linkBusinessPortalUser,
  recomputeBusinessUsage,
  unlinkBusinessPortalUser,
} from "@/lib/actions/business-billing";

export interface SubscriptionPanelProps {
  businessId: string;
  planKey: string;
  subscriptionStatus: string;
  hasSubscription: boolean;
  periodEnd: string | null;
  usage: { used: number; included: number; overageUnits: number; overageCents: number; unbilledOverageCents: number; projectedTotalCents: number } | null;
  totalUnbilledOverageCents: number;
  members: { id: string; name: string; email: string; role: string }[];
  stripeReady: boolean;
  missingPriceEnv: string[];
}

export function BusinessSubscriptionPanel(p: SubscriptionPanelProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("owner");
  const active = p.hasSubscription && ["active", "past_due", "incomplete"].includes(p.subscriptionStatus);
  const legacy = isLegacyPlanKey(p.planKey);

  const run = (fn: () => Promise<{ success: boolean; error?: string }>, ok: string) =>
    start(async () => {
      const res = await fn();
      if (!res.success) toast.error(res.error ?? "Something went wrong");
      else {
        toast.success(ok);
        router.refresh();
      }
    });

  const pct = p.usage ? Math.min(100, (p.usage.used / Math.max(1, p.usage.included)) * 100) : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle>Subscription &amp; Usage</CardTitle>
        <div className="flex items-center gap-2">
          <Badge tone={legacy ? "amber" : isSubscriptionPlanKey(p.planKey) ? "blue" : "neutral"}>{planDisplayName(p.planKey || null)}</Badge>
          {p.subscriptionStatus && <Badge tone={p.subscriptionStatus === "active" ? "green" : "amber"}>{p.subscriptionStatus}</Badge>}
        </div>
      </CardHeader>
      <CardBody className="space-y-6">
        {!p.stripeReady && (
          <p className="rounded-lg bg-warning-100 p-3 text-xs text-warning-600">
            Online checkout is off until these env vars are set: {p.missingPriceEnv.join(", ") || "STRIPE_SECRET_KEY"}.
          </p>
        )}
        {legacy && (
          <p className="rounded-lg bg-warning-100 p-3 text-xs text-warning-600">
            Business Unlimited is discontinued. This subscription keeps working until changed or cancelled; it can be moved to Business10 or Business30 below.
          </p>
        )}

        {p.usage && (
          <div>
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-semibold text-navy-900">
                {p.usage.used} / {p.usage.included} notarizations
              </span>
              {p.periodEnd && <span className="text-xs text-navy-400">Period ends {new Date(p.periodEnd).toLocaleDateString()}</span>}
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-navy-100">
              <div className={`h-full rounded-full ${p.usage.overageUnits > 0 ? "bg-warning-500" : "bg-accent-500"}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs">
              <div className="rounded-lg bg-navy-50 p-2"><p className="text-navy-400">Overage</p><p className="font-bold text-navy-900">{p.usage.overageUnits} · {formatCents(p.usage.overageCents, { showCents: false })}</p></div>
              <div className="rounded-lg bg-navy-50 p-2"><p className="text-navy-400">Unbilled</p><p className="font-bold text-navy-900">{formatCents(p.usage.unbilledOverageCents, { showCents: false })}</p></div>
              <div className="rounded-lg bg-navy-50 p-2"><p className="text-navy-400">Projected</p><p className="font-bold text-navy-900">{formatCents(p.usage.projectedTotalCents, { showCents: false })}</p></div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{active ? "Change plan" : "Start a plan"}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {SUBSCRIPTION_PLAN_LIST.map((plan) => {
              const current = p.planKey === plan.key && active;
              return (
                <Button
                  key={plan.key}
                  variant={current ? "subtle" : "outline"}
                  disabled={pending || current || !p.stripeReady}
                  onClick={() =>
                    active
                      ? run(() => changeBusinessPlanAdmin(p.businessId, plan.key), `Switched to ${plan.name} (prorated by Stripe)`)
                      : start(async () => {
                          const res = await createBusinessCheckoutLink(p.businessId, plan.key);
                          if (!res.success) toast.error(res.error);
                          else setCheckoutUrl(res.url);
                        })
                  }
                  className="h-auto justify-between py-3"
                >
                  <span className="text-left">
                    <span className="block font-bold">{plan.name}</span>
                    <span className="block text-xs font-normal text-navy-500">{plan.includedNotarizations} incl. · {formatCents(plan.overagePerNotarizationCents, { showCents: false })} after</span>
                  </span>
                  <span className="text-sm">{current ? "Current" : `${formatCents(plan.monthlyCents, { showCents: false })}/mo`}</span>
                </Button>
              );
            })}
          </div>
          {checkoutUrl && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-accent-100/60 p-3 text-xs">
              <span className="font-semibold text-accent-700">Checkout link ready (expires in 24h):</span>
              <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(checkoutUrl).then(() => toast.success("Copied"))}>
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
              <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-accent-700 underline">
                Open <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
          {active && <p className="text-xs text-navy-400">Plan changes apply immediately; Stripe prorates the monthly charge. Usage already recorded keeps its original plan terms.</p>}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="dark" disabled={pending || p.totalUnbilledOverageCents <= 0}
            onClick={() => start(async () => {
              const res = await invoiceBusinessOverage(p.businessId);
              if (!res.success) toast.error(res.error);
              else { toast.success("Draft overage invoice created"); router.push(`/admin/invoices/${res.invoiceId}`); }
            })}>
            <Receipt className="h-4 w-4" /> Invoice overage ({formatCents(p.totalUnbilledOverageCents, { showCents: false })})
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => recomputeBusinessUsage(p.businessId), "Usage recalculated")}>
            <RefreshCw className="h-4 w-4" /> Recalculate usage
          </Button>
          {pending && <Loader2 className="h-4 w-4 animate-spin text-navy-400" />}
        </div>

        <div className="space-y-3 border-t border-navy-100 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">Client portal access</p>
          {p.members.length === 0 ? (
            <p className="text-sm text-navy-400">No one can manage this business from the portal yet.</p>
          ) : (
            <ul className="divide-y divide-navy-100 rounded-lg border border-navy-100">
              {p.members.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-navy-900">{m.name}</p>
                    <p className="truncate text-xs text-navy-400">{m.email} · {m.role}</p>
                  </div>
                  <Button size="sm" variant="ghost" aria-label={`Remove ${m.email}`} disabled={pending}
                    onClick={() => run(() => unlinkBusinessPortalUser(m.id), "Access removed")}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                const res = await linkBusinessPortalUser({ businessId: p.businessId, email, role: role as "owner" });
                if (res.success) setEmail("");
                return res;
              }, "Portal access granted");
            }}
          >
            <Input type="email" required placeholder="person@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="sm:flex-1" />
            <Select value={role} onChange={(e) => setRole(e.target.value)} className="sm:w-32" aria-label="Role">
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </Select>
            <Button type="submit" size="md" disabled={pending}><UserPlus className="h-4 w-4" /> Add</Button>
          </form>
          <p className="text-xs text-navy-400">Owners and admins can start, switch, and pay for plans in the <Link href="/portal/login" className="underline">client portal</Link>.</p>
        </div>
        <p className="flex items-center gap-1 text-[11px] text-navy-400"><Repeat className="h-3 w-3" /> Usage counts each notarial act on this business&apos;s completed appointments.</p>
      </CardBody>
    </Card>
  );
}
