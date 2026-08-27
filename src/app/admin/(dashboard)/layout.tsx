import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getBusinessSettings } from "@/lib/settings";
import { getRecentNotifications } from "@/lib/actions/notifications";
import { AdminShell } from "@/components/admin/shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const settings = await getBusinessSettings();
  if (!settings.setupCompleted) redirect("/admin/setup");

  const notifications = await getRecentNotifications(15);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AdminShell userName={session.name} notifications={notifications} unreadCount={unreadCount}>
      {children}
    </AdminShell>
  );
}
