import { PortalShell } from "@/components/portal/shell";
import { getPortalAccount } from "@/lib/portal/account";
import { initials } from "@/lib/portal/present";

export const metadata = {
  title: { default: "Client Portal", template: "%s · Notar-E Portal" },
  robots: { index: false, follow: false },
};

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // Redirects to /portal/login when there is no valid *client* session.
  const account = await getPortalAccount();
  const status = account.plan.status;

  return (
    <PortalShell
      account={{
        displayName: account.displayName,
        personName: account.client.name,
        email: account.client.email,
        initials: initials(account.business?.companyName || account.client.name),
        planName: account.plan.name,
        planActive: account.plan.kind === "payg" || status === "" || status === "active" || status === "trialing",
        canRequest: account.canRequest,
      }}
    >
      {children}
    </PortalShell>
  );
}
