import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCareerApplications } from "@/lib/actions/careers";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Career Applications",
};

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "interview", label: "Interview" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function statusBadgeClass(status: string): string {
  switch (status) {
    case "new":
      return "bg-accent-100 text-accent-700";
    case "reviewing":
      return "bg-warning-100 text-warning-600";
    case "interview":
      return "bg-purple-100 text-purple-700";
    case "approved":
      return "bg-success-100 text-success-600";
    case "rejected":
      return "bg-danger-100 text-danger-600";
    default:
      return "bg-navy-100 text-navy-600";
  }
}

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default async function CareersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "all" } = await searchParams;
  const applications = await getCareerApplications(status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Career Applications</h1>
          <p className="mt-1 text-sm text-navy-400">
            {applications.length} application{applications.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/admin/careers?status=${tab.value}`}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              status === tab.value
                ? "bg-navy-900 text-white"
                : "bg-navy-50 text-navy-500 hover:bg-navy-100"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      {applications.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No applications yet"
          description="Career applications submitted through the website will appear here."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-navy-50 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Role Interest</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Notary</th>
                  <th className="px-5 py-3">Applied</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-navy-50">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/careers/${app.id}`}
                        className="font-semibold text-navy-900 hover:text-accent-600"
                      >
                        {app.firstName} {app.lastName}
                      </Link>
                      <p className="text-xs text-navy-400">{app.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-navy-600">{app.roleInterest}</td>
                    <td className="px-5 py-3.5 text-navy-600">
                      {app.city}, {app.state}
                    </td>
                    <td className="px-5 py-3.5">
                      {app.isCommissionedNotary ? (
                        <span className="rounded-full bg-success-100 px-2 py-0.5 text-xs font-medium text-success-600">
                          Yes
                        </span>
                      ) : (
                        <span className="rounded-full bg-navy-100 px-2 py-0.5 text-xs font-medium text-navy-500">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-navy-500">
                      {formatDate(app.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(app.status)}`}
                      >
                        {statusLabel(app.status)}
                      </span>
                    </td>
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
