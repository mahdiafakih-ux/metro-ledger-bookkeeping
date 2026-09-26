import Link from "next/link";
import { Briefcase, FileText, MapPin, Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { JobOpeningsManager } from "@/components/admin/careers/job-openings-manager";
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_TONES,
  CAREER_ROLE_LABELS,
  type ApplicationStatus,
} from "@/lib/careers";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const metadata = { title: "Careers" };

export default async function CareersAdminPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = "all", q = "" } = await searchParams;
  const statusFilter = (APPLICATION_STATUSES as readonly string[]).includes(status) ? status : "all";
  const query = q.trim().slice(0, 100);

  const [applications, counts, openings] = await Promise.all([
    prisma.careerApplication.findMany({
      where: {
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
        ...(query
          ? {
              OR: [
                { firstName: { contains: query, mode: "insensitive" } },
                { lastName: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
                { city: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 300,
      // Never load resume bytes in a list — only whether one exists.
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true, city: true, state: true,
        roleKey: true, isCommissioned: true, commissionState: true, status: true, createdAt: true,
        resume: { select: { id: true } },
        jobOpening: { select: { title: true } },
      },
    }),
    prisma.careerApplication.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.jobOpening.findMany({ orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }], include: { _count: { select: { applications: true } } } }),
  ]);

  const countBy = Object.fromEntries(counts.map((c) => [c.status, c._count._all])) as Record<string, number>;
  const total = counts.reduce((s, c) => s + c._count._all, 0);
  const tabs: { key: string; label: string; count: number }[] = [
    { key: "all", label: "All", count: total },
    ...APPLICATION_STATUSES.map((s) => ({ key: s, label: APPLICATION_STATUS_LABELS[s], count: countBy[s] ?? 0 })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Careers</h1>
        <p className="mt-1 text-sm text-navy-400">
          {total} application{total === 1 ? "" : "s"} · {countBy.new ?? 0} new
        </p>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-2">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={`/admin/careers${t.key === "all" ? "" : `?status=${t.key}`}${query ? `${t.key === "all" ? "?" : "&"}q=${encodeURIComponent(query)}` : ""}`}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors",
                statusFilter === t.key ? "bg-navy-900 text-white" : "bg-white text-navy-600 ring-1 ring-navy-100 hover:bg-navy-50"
              )}
            >
              {t.label}
              <span className={cn("rounded-full px-1.5 text-xs", statusFilter === t.key ? "bg-white/20" : "bg-navy-100")}>{t.count}</span>
            </Link>
          ))}
        </div>
      </div>

      <form className="relative max-w-sm">
        {statusFilter !== "all" && <input type="hidden" name="status" value={statusFilter} />}
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" />
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search name, email, city…"
          className="w-full rounded-lg border border-navy-200 py-2 pl-9 pr-3 text-base focus:border-accent-500 focus:outline-none sm:text-sm"
        />
      </form>

      {applications.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={total === 0 ? "No applications yet" : "No matches"}
          description={total === 0 ? "Applications from /careers show up here." : "Try a different filter or search."}
        />
      ) : (
        <Card className="overflow-hidden">
          {/* Mobile: cards */}
          <ul className="divide-y divide-navy-100 md:hidden">
            {applications.map((a) => (
              <li key={a.id}>
                <Link href={`/admin/careers/${a.id}`} className="block p-4 active:bg-navy-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-navy-900">{a.firstName} {a.lastName}</p>
                      <p className="truncate text-sm text-navy-500">{CAREER_ROLE_LABELS[a.roleKey] ?? a.roleKey}</p>
                    </div>
                    <Badge tone={APPLICATION_STATUS_TONES[a.status as ApplicationStatus] ?? "neutral"}>
                      {APPLICATION_STATUS_LABELS[a.status as ApplicationStatus] ?? a.status}
                    </Badge>
                  </div>
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-navy-400">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {a.city}, {a.state}</span>
                    <span>{a.isCommissioned ? `Commissioned (${a.commissionState})` : "Not commissioned"}</span>
                    <span>{formatDate(a.createdAt)}</span>
                    {a.resume && <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" /> Resume</span>}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          {/* Desktop: table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="bg-navy-50 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Notary</th>
                  <th className="px-5 py-3">Applied</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {applications.map((a) => (
                  <tr key={a.id} className="hover:bg-navy-50">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/careers/${a.id}`} className="font-semibold text-navy-900 hover:text-accent-600">
                        {a.firstName} {a.lastName}
                      </Link>
                      {a.resume && <FileText className="ml-1.5 inline h-3.5 w-3.5 text-navy-300" aria-label="Has resume" />}
                    </td>
                    <td className="px-5 py-3.5 text-navy-600">
                      {CAREER_ROLE_LABELS[a.roleKey] ?? a.roleKey}
                      {a.jobOpening && <span className="block text-xs text-navy-400">{a.jobOpening.title}</span>}
                    </td>
                    <td className="px-5 py-3.5 text-navy-600">{a.city}, {a.state}</td>
                    <td className="px-5 py-3.5 text-navy-600">
                      <span className="block">{a.email}</span>
                      <span className="block text-xs text-navy-400">{a.phone}</span>
                    </td>
                    <td className="px-5 py-3.5 text-navy-600">{a.isCommissioned ? `Yes · ${a.commissionState}` : "No"}</td>
                    <td className="px-5 py-3.5 text-navy-600">{formatDate(a.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <Badge tone={APPLICATION_STATUS_TONES[a.status as ApplicationStatus] ?? "neutral"}>
                        {APPLICATION_STATUS_LABELS[a.status as ApplicationStatus] ?? a.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Open Positions</CardTitle>
          <p className="mt-1 text-xs text-navy-400">
            Only active openings appear on /careers as &ldquo;Now hiring&rdquo;. With none active, the page invites people to join the network instead.
          </p>
        </CardHeader>
        <CardBody>
          <JobOpeningsManager
            openings={openings.map((o) => ({
              id: o.id,
              title: o.title,
              roleKey: o.roleKey,
              location: o.location,
              employment: o.employment,
              isActive: o.isActive,
              applications: o._count.applications,
            }))}
          />
        </CardBody>
      </Card>
    </div>
  );
}
