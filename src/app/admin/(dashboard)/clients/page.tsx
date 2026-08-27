import Link from "next/link";
import { Plus, Users, Download } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge, STATUS_TONES } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCents } from "@/lib/money";
import { LEAD_STATUS_LABELS } from "@/lib/constants";
import { formatDate, titleCase } from "@/lib/utils";

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q = "", status = "all" } = await searchParams;

  const clients = await prisma.client.findMany({
    where: {
      ...(status !== "all" ? { leadStatus: status } : {}),
      ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { company: { contains: q } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Clients</h1>
          <p className="mt-1 text-sm text-navy-400">{clients.length} client{clients.length === 1 ? "" : "s"}</p>
        </div>
        <div className="flex gap-2">
          <LinkButton href="/api/export/clients" variant="outline"><Download className="h-4 w-4" /> Export CSV</LinkButton>
          <LinkButton href="/admin/clients/new"><Plus className="h-4 w-4" /> New Client</LinkButton>
        </div>
      </div>

      <form className="flex gap-2">
        <input type="search" name="q" defaultValue={q} placeholder="Search clients..." className="w-full max-w-sm rounded-lg border border-navy-200 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
      </form>

      {clients.length === 0 ? (
        <EmptyState icon={Users} title="No clients yet" description="Clients are created automatically from bookings, or you can add one manually." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-navy-50 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Appointments</th>
                  <th className="px-5 py-3">Revenue</th>
                  <th className="px-5 py-3">Follow-Up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-navy-50">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/clients/${c.id}`} className="font-semibold text-navy-900 hover:text-accent-600">{c.name}</Link>
                      {c.company && <p className="text-xs text-navy-400">{c.company}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-navy-600">{titleCase(c.clientType)}</td>
                    <td className="px-5 py-3.5"><Badge tone={STATUS_TONES[c.leadStatus] ?? "neutral"}>{LEAD_STATUS_LABELS[c.leadStatus]}</Badge></td>
                    <td className="px-5 py-3.5 text-navy-600">{c.totalAppointments}</td>
                    <td className="px-5 py-3.5 font-medium text-navy-900">{formatCents(c.totalRevenueCents, { showCents: false })}</td>
                    <td className="px-5 py-3.5 text-navy-500">{c.followUpDate ? formatDate(c.followUpDate) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
