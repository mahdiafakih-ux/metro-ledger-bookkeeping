import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { getCareerApplicationById } from "@/lib/actions/careers";
import { formatDate } from "@/lib/utils";
import { StatusUpdater } from "./status-updater";

export const metadata: Metadata = {
  title: "Applicant Detail",
};

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

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{label}</p>
      <p className="mt-1 text-sm text-navy-900">{value || "—"}</p>
    </div>
  );
}

export default async function CareerApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const app = await getCareerApplicationById(id);
  if (!app) notFound();

  const statusLabel = app.status.charAt(0).toUpperCase() + app.status.slice(1);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back link */}
      <Link
        href="/admin/careers"
        className="inline-flex items-center gap-1.5 text-sm text-navy-500 hover:text-navy-900 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Career Applications
      </Link>

      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            {app.firstName} {app.lastName}
          </h1>
          <p className="mt-1 text-sm text-navy-400">
            Applied {formatDate(app.createdAt)}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(app.status)}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Status updater */}
      <Card>
        <CardHeader>
          <CardTitle>Update Status</CardTitle>
        </CardHeader>
        <CardBody>
          <StatusUpdater id={app.id} currentStatus={app.status} />
        </CardBody>
      </Card>

      {/* Contact details */}
      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            <Field label="First Name" value={app.firstName} />
            <Field label="Last Name" value={app.lastName} />
            <Field label="Email" value={app.email} />
            <Field label="Phone" value={app.phone} />
            <Field label="City" value={app.city} />
            <Field label="State" value={app.state} />
          </div>
        </CardBody>
      </Card>

      {/* Role & notary status */}
      <Card>
        <CardHeader>
          <CardTitle>Role &amp; Notary Status</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            <Field label="Area of Interest" value={app.roleInterest} />
            <Field
              label="Commissioned Notary"
              value={app.isCommissionedNotary ? "Yes" : "No"}
            />
            <Field label="Commission State" value={app.commissionState} />
            <Field label="Commission Expiry" value={app.commissionExpiry} />
          </div>
        </CardBody>
      </Card>

      {/* Experience & availability */}
      <Card>
        <CardHeader>
          <CardTitle>Experience &amp; Availability</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {app.mobileExperience && (
                <span className="rounded-full bg-accent-100 px-3 py-0.5 text-xs font-medium text-accent-700">
                  Mobile Notary
                </span>
              )}
              {app.ronExperience && (
                <span className="rounded-full bg-accent-100 px-3 py-0.5 text-xs font-medium text-accent-700">
                  RON Experience
                </span>
              )}
              {app.signingAgentExperience && (
                <span className="rounded-full bg-accent-100 px-3 py-0.5 text-xs font-medium text-accent-700">
                  Loan Signing Agent
                </span>
              )}
              {!app.mobileExperience && !app.ronExperience && !app.signingAgentExperience && (
                <span className="text-sm text-navy-400">None indicated</span>
              )}
            </div>
            <Field label="Availability" value={app.availability} />
            {app.linkedinUrl && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">
                  LinkedIn / Website
                </p>
                <a
                  href={app.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-sm text-accent-600 hover:underline"
                >
                  {app.linkedinUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Message */}
      {app.message && (
        <Card>
          <CardHeader>
            <CardTitle>Message</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-navy-700">
              {app.message}
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
