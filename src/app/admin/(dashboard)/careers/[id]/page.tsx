import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApplicationControls } from "@/components/admin/careers/application-controls";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_TONES,
  CAREER_ROLE_LABELS,
  EXPERIENCE_LABELS,
  type ApplicationStatus,
} from "@/lib/careers";
import { formatDate, formatDateTime, telHref } from "@/lib/utils";

export const metadata = { title: "Application" };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:justify-between sm:gap-6">
      <dt className="text-xs font-semibold uppercase tracking-wide text-navy-400">{label}</dt>
      <dd className="text-sm font-medium text-navy-900 sm:text-right">{children}</dd>
    </div>
  );
}

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await prisma.careerApplication.findUnique({
    where: { id },
    include: {
      resume: { select: { fileName: true, sizeBytes: true, mimeType: true } },
      jobOpening: { select: { title: true } },
    },
  });
  if (!a) notFound();
  const status = a.status as ApplicationStatus;
  const safeLink = /^https?:\/\//i.test(a.linkedinUrl) ? a.linkedinUrl : "";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/admin/careers" className="inline-flex items-center gap-1 text-sm font-medium text-navy-500 hover:text-navy-900">
        <ArrowLeft className="h-4 w-4" /> All applications
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{a.firstName} {a.lastName}</h1>
          <p className="mt-1 text-sm text-navy-400">
            {CAREER_ROLE_LABELS[a.roleKey] ?? a.roleKey}
            {a.jobOpening ? ` · ${a.jobOpening.title}` : ""} · applied {formatDateTime(a.createdAt)}
          </p>
        </div>
        <Badge tone={APPLICATION_STATUS_TONES[status] ?? "neutral"}>{APPLICATION_STATUS_LABELS[status] ?? a.status}</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <a href={telHref(a.phone)} className="flex h-11 items-center gap-2 rounded-full bg-success-100/60 px-4 text-sm font-semibold text-success-600">
          <Phone className="h-4 w-4" /> {a.phone}
        </a>
        <a href={`mailto:${a.email}`} className="flex h-11 max-w-full items-center gap-2 rounded-full bg-accent-100/60 px-4 text-sm font-semibold text-accent-700">
          <Mail className="h-4 w-4 shrink-0" /> <span className="truncate">{a.email}</span>
        </a>
      </div>

      <ApplicationControls id={a.id} status={status} notes={a.adminNotes} />

      <Card>
        <CardHeader><CardTitle>Application</CardTitle></CardHeader>
        <CardBody>
          <dl className="divide-y divide-navy-100">
            <Row label="Location"><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-navy-400" /> {a.city}, {a.state}</span></Row>
            <Row label="Area of interest">{CAREER_ROLE_LABELS[a.roleKey] ?? a.roleKey}</Row>
            <Row label="Commissioned notary">
              {a.isCommissioned ? `Yes — ${a.commissionState}${a.commissionExpiration ? `, expires ${formatDate(a.commissionExpiration)}` : ""}` : "No"}
            </Row>
            <Row label="Mobile notary experience">{EXPERIENCE_LABELS[a.mobileExperience] ?? a.mobileExperience}</Row>
            <Row label="Remote online notarization">{EXPERIENCE_LABELS[a.ronExperience] ?? a.ronExperience}</Row>
            <Row label="Signing-agent experience">{EXPERIENCE_LABELS[a.signingAgentExperience] ?? a.signingAgentExperience}</Row>
            <Row label="Availability">{a.availability || "—"}</Row>
            <Row label="LinkedIn / website">
              {safeLink ? (
                <a href={safeLink} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 break-all text-accent-600 hover:underline">
                  {safeLink} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              ) : "—"}
            </Row>
            <Row label="Resume">
              {a.resume ? (
                <a href={`/api/admin/careers/${a.id}/resume`} className="inline-flex items-center gap-1.5 text-accent-600 hover:underline">
                  <Download className="h-4 w-4" /> {a.resume.fileName} ({Math.max(1, Math.round(a.resume.sizeBytes / 1024))} KB)
                </a>
              ) : "Not provided"}
            </Row>
          </dl>
          {a.message && (
            <div className="mt-4 rounded-xl bg-navy-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">Message</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-navy-700">{a.message}</p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
