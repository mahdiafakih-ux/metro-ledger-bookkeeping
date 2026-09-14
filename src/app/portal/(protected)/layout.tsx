import { redirect } from "next/navigation";
import { getClientSession } from "@/lib/client-auth";
import { PortalNav } from "@/components/portal/nav";

export const metadata = {
  title: "Client Portal",
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getClientSession();

  if (!session) {
    redirect("/portal/login");
  }

  return (
    <div className="min-h-screen bg-navy-50">
      <PortalNav session={session} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
