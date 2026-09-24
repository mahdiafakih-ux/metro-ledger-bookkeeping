import { Building2, CreditCard } from "lucide-react";
import { getPortalAccount } from "@/lib/portal/account";
import { formatDetroitDate } from "@/lib/tz";
import { ProfileForm } from "@/components/portal/profile-form";
import { KeyValue, PageHeader, Panel, PanelHeader, PortalLink } from "@/components/portal/ui";

export const metadata = { title: "Profile" };

const ROLE_LABELS: Record<string, string> = { owner: "Owner", admin: "Admin", member: "Member", viewer: "View only" };

export default async function ProfilePage() {
  const account = await getPortalAccount();

  return (
    <div className="portal-enter space-y-6">
      <PageHeader title="Profile" description="Your contact details and account information." />

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel className="lg:col-span-3">
          <PanelHeader title="Personal information" />
          <ProfileForm
            initial={{
              name: account.client.name,
              email: account.client.email,
              phone: account.client.phone,
              company: account.client.company,
            }}
          />
        </Panel>

        <div className="space-y-6 lg:col-span-2">
          {account.business && (
            <Panel>
              <PanelHeader title="Business account" />
              <div className="flex items-center gap-3 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-white">
                  <Building2 className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold text-navy-950">{account.business.companyName}</p>
                  <p className="text-[13px] text-navy-500">Your role: {ROLE_LABELS[account.business.role] ?? account.business.role}</p>
                </div>
              </div>
              <p className="border-t border-navy-100 px-5 py-3 text-[13px] text-navy-500">
                Company billing details are managed by Notar-E. Contact support to update them.
              </p>
            </Panel>
          )}

          <Panel>
            <PanelHeader title="Account" />
            <dl className="grid grid-cols-2 gap-5 p-5">
              <KeyValue label="Plan">{account.plan.name}</KeyValue>
              <KeyValue label="Member since">{formatDetroitDate(account.client.createdAt, { day: undefined })}</KeyValue>
            </dl>
            <div className="border-t border-navy-100 px-5 py-3">
              <PortalLink href="/portal/billing" variant="ghost" size="sm" className="-ml-2">
                <CreditCard className="h-4 w-4" aria-hidden /> Billing & payment method
              </PortalLink>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
