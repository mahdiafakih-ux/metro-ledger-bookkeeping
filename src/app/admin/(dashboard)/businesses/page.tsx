import Link from "next/link";
import { Plus, Building2, Download } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge, STATUS_TONES } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCents } from "@/lib/money";
import { BUSINESS_CATEGORY_LABELS } from "@/lib/constants";
import { formatDate, titleCase } from "@/lib/utils";

export default async function BusinessesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const businesses = await prisma.business.findMany({
    where: q ? { OR: [{ companyName: { contains: q } }, { contactName: { contains: q } }] } : {},
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Businesses</h1>
          <p className="mt-1 text-sm text-navy-400">{businesses.length} organization{businesses.length === 1 ? "" : "s"}</p>
        </div>
        <div className="flex gap-2">
          <LinkButton href="/api/export/businesses" variant="outline"><Download className="h-4 w-4" /> Export CSV</LinkButton>
          <LinkButton href="/admin/businesses/new"><Plus className="h-4 w-4" /> New Business</LinkButton>
        </div>
      </div>

      <form className="flex gap-2">
        <input type="search" name="q" defaultValue={q} placeholder="Search businesses..." className="w-full max-w-sm rounded-lg border border-navy-200 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none" />
      </form>

      {businesses.length === 0 ? (
        <EmptyState icon={Building2} title="No businesses yet" description="Add title companies, law firms, and other recurring partners here." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-navy-50 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
                <tr>
                  <th className="px-5 py-3">Company</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Monthly Usage</th>
                  <th className="px-5 py-3">Monthly Revenue</th>
                  <th className="px-5 py-3">Renewal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {businesses.map((b) => (
                  <tr key={b.id} className="hover:bg-navy-50">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/businesses/${b.id}`} className="font-semibold text-navy-900 hover:text-accent-600">{b.companyName}</Link>
                      {b.contactName && <p className="text-xs text-navy-400">{b.contactName}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-navy-600">{BUSINESS_CATEGORY_LABELS[b.category]}</td>
                    <td className="px-5 py-3.5"><Badge tone={STATUS_TONES[b.status] ?? "neutral"}>{titleCase(b.status)}</Badge></td>
                    <td className="px-5 py-3.5 text-navy-600">{b.monthlyUsage}</td>
                    <td className="px-5 py-3.5 font-medium text-navy-900">{formatCents(b.monthlyRevenueCents, { showCents: false })}</td>
                    <td className="px-5 py-3.5 text-navy-500">{b.renewalDate ? formatDate(b.renewalDate) : "—"}</td>
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
