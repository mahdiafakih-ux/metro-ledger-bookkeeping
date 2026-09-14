import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getBusinessSettings } from "@/lib/settings";

export default async function SetupLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login?next=/admin/setup");

  const settings = await getBusinessSettings();
  if (settings.setupCompleted) redirect("/admin");

  return children;
}
