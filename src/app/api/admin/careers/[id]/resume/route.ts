import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";

/**
 * Resume download — admin session required. Files are never publicly
 * addressable: bytes live in Postgres and are streamed only here, always as
 * an attachment with no-sniff and no-store headers.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const resume = await prisma.careerResume.findUnique({ where: { applicationId: id } });
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const safeName = resume.fileName.replace(/[^a-zA-Z0-9._ -]/g, "_");
  return new NextResponse(Buffer.from(resume.data), {
    headers: {
      "Content-Type": resume.mimeType,
      "Content-Length": String(resume.sizeBytes),
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
