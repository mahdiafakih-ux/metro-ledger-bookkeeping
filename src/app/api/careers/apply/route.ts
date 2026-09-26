import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  CAREER_ROLE_LABELS,
  RESUME_MAX_BYTES,
  RESUME_TYPES,
  careerApplicationSchema,
  sniffResumeType,
} from "@/lib/careers";
import { sendCareerApplicationNotificationEmail, sendCareerApplicationReceivedEmail } from "@/lib/email";

const MIN_FILL_MS = 4_000; // humans don't finish this form in under 4 seconds
const MAX_FILL_MS = 1000 * 60 * 60 * 24; // stale form (> 1 day)

/**
 * Public career application endpoint (multipart/form-data).
 * Abuse protection: per-IP rate limit, hidden honeypot field, minimum fill
 * time, duplicate-submission window, strict schema validation, and resume
 * type checked by file signature (not just the browser-supplied MIME type).
 */
export async function POST(request: NextRequest) {
  const ip = await getClientIp();
  if (!rateLimit(`careers:${ip}`, 5, 60 * 60 * 1000).allowed) {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  // Honeypot + timing: pretend success so bots don't learn anything.
  const honeypot = String(form.get("company_website") ?? "");
  const startedAt = Number(form.get("startedAt"));
  const elapsed = Date.now() - startedAt;
  if (honeypot || !Number.isFinite(startedAt) || elapsed < MIN_FILL_MS || elapsed > MAX_FILL_MS) {
    return NextResponse.json({ ok: true });
  }

  const raw: Record<string, string> = {};
  for (const key of [
    "firstName", "lastName", "email", "phone", "city", "state", "roleKey", "jobOpeningId", "isCommissioned",
    "commissionState", "commissionExpiration", "mobileExperience", "ronExperience", "signingAgentExperience",
    "availability", "linkedinUrl", "message",
  ]) {
    const v = form.get(key);
    if (typeof v === "string") raw[key] = v;
  }
  const parsed = careerApplicationSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = String(issue.path[0] ?? "form");
      fieldErrors[k] ??= issue.message;
    }
    return NextResponse.json({ error: "Please fix the highlighted fields.", fieldErrors }, { status: 400 });
  }
  const data = parsed.data;

  // Resume (optional)
  let resume: { fileName: string; mimeType: string; sizeBytes: number; data: Uint8Array<ArrayBuffer> } | null = null;
  const file = form.get("resume");
  if (file && typeof file !== "string" && file.size > 0) {
    if (file.size > RESUME_MAX_BYTES) {
      return NextResponse.json({ error: "Resume must be 3 MB or smaller.", fieldErrors: { resume: "Max 3 MB" } }, { status: 400 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const sniffed = sniffResumeType(bytes);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!sniffed || RESUME_TYPES[sniffed] !== ext) {
      return NextResponse.json({ error: "Resume must be a PDF or Word document.", fieldErrors: { resume: "PDF, DOC or DOCX only" } }, { status: 400 });
    }
    const base = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 60) || "resume";
    resume = { fileName: `${base}.${ext}`, mimeType: sniffed, sizeBytes: file.size, data: bytes };
  }

  // Only link to an opening that is actually open.
  let jobOpeningId: string | null = null;
  if (data.jobOpeningId) {
    const opening = await prisma.jobOpening.findFirst({ where: { id: data.jobOpeningId, isActive: true }, select: { id: true } });
    jobOpeningId = opening?.id ?? null;
  }

  const recent = await prisma.careerApplication.findFirst({
    where: { email: data.email, createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    select: { id: true },
  });
  if (recent) {
    return NextResponse.json({ error: "We already received an application from this email today. Thank you!" }, { status: 409 });
  }

  const application = await prisma.careerApplication.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      city: data.city,
      state: data.state,
      roleKey: data.roleKey,
      jobOpeningId,
      isCommissioned: data.isCommissioned === "yes",
      commissionState: data.isCommissioned === "yes" ? data.commissionState.toUpperCase() : "",
      commissionExpiration: data.isCommissioned === "yes" && data.commissionExpiration ? new Date(`${data.commissionExpiration}T00:00:00Z`) : null,
      mobileExperience: data.mobileExperience,
      ronExperience: data.ronExperience,
      signingAgentExperience: data.signingAgentExperience,
      availability: data.availability,
      linkedinUrl: data.linkedinUrl,
      message: data.message,
      ipAddress: ip.slice(0, 64),
      ...(resume ? { resume: { create: resume } } : {}),
    },
    select: { id: true },
  });

  const name = `${data.firstName} ${data.lastName}`;
  const role = CAREER_ROLE_LABELS[data.roleKey] ?? data.roleKey;
  await prisma.notification
    .create({
      data: { type: "career_application", title: "New career application", body: `${name} — ${role}`, link: `/admin/careers/${application.id}` },
    })
    .catch(() => undefined);
  await Promise.allSettled([
    sendCareerApplicationNotificationEmail({
      applicationId: application.id,
      name,
      email: data.email,
      phone: data.phone,
      location: `${data.city}, ${data.state}`,
      role,
      commissioned: data.isCommissioned === "yes",
    }),
    sendCareerApplicationReceivedEmail({ to: data.email, firstName: data.firstName }),
  ]);

  return NextResponse.json({ ok: true });
}
