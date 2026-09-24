import { prisma } from "@/lib/db";
import { NotaryManager } from "@/components/admin/notary-manager";

export const metadata = { title: "Notaries" };

export default async function NotariesPage() {
  const now = new Date();
  const [notaries, upcoming, completed, preferred] = await Promise.all([
    prisma.notary.findMany({ orderBy: [{ isActive: "desc" }, { displayName: "asc" }] }),
    prisma.appointment.groupBy({
      by: ["assignedNotaryId"],
      where: { assignedNotaryId: { not: null }, status: "scheduled", scheduledEnd: { gte: now } },
      _count: { _all: true },
    }),
    prisma.appointment.groupBy({
      by: ["assignedNotaryId"],
      where: { assignedNotaryId: { not: null }, status: "completed" },
      _count: { _all: true },
    }),
    prisma.preferredNotary.groupBy({ by: ["notaryId"], _count: { _all: true } }),
  ]);
  const up = new Map(upcoming.map((r) => [r.assignedNotaryId, r._count._all]));
  const done = new Map(completed.map((r) => [r.assignedNotaryId, r._count._all]));
  const pref = new Map(preferred.map((r) => [r.notaryId, r._count._all]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Notaries</h1>
        <p className="mt-1 text-sm text-navy-400">
          Notaries you can assign to appointments. Clients see the display name (and photo, if set) on completed appointments and can
          add them as preferred. Deactivate rather than delete to keep history.
        </p>
      </div>
      <NotaryManager
        notaries={notaries.map((n) => ({
          id: n.id,
          displayName: n.displayName,
          fullName: n.fullName,
          email: n.email,
          phone: n.phone,
          photoUrl: n.photoUrl,
          isActive: n.isActive,
          upcoming: up.get(n.id) ?? 0,
          completed: done.get(n.id) ?? 0,
          preferredBy: pref.get(n.id) ?? 0,
        }))}
      />
    </div>
  );
}
