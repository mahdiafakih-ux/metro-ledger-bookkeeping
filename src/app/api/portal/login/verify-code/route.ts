import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  ACCESS_CODE_MAX_ATTEMPTS,
  setClientSessionCookie,
  verifyAccessCode,
} from "@/lib/client-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  code: z.string().trim().regex(/^\d{6}$/),
});

// One generic message for every failure mode so responses don't reveal
// whether an account exists or which part was wrong.
const INVALID = "That code is invalid or has expired. Please request a new one.";

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });
    }
    const { email, code } = parsed.data;

    const ip = await getClientIp();
    const byIp = rateLimit(`portal-verify:ip:${ip}`, 30, 15 * 60 * 1000);
    if (!byIp.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait a few minutes and try again." },
        { status: 429 }
      );
    }

    const client = await prisma.client.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    if (!client) {
      return NextResponse.json({ error: INVALID }, { status: 401 });
    }

    const now = new Date();
    const session = await prisma.clientAccessSession.findFirst({
      where: {
        clientId: client.id,
        expiresAt: { gt: now },
        usedAt: null,
        failedAttempts: { lt: ACCESS_CODE_MAX_ATTEMPTS },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!session) {
      return NextResponse.json({ error: INVALID }, { status: 401 });
    }

    const codeValid = await verifyAccessCode(code, session.codeHash);
    if (!codeValid) {
      // Persisted, atomic attempt counter: holds across serverless instances.
      const updated = await prisma.clientAccessSession.update({
        where: { id: session.id },
        data: { failedAttempts: { increment: 1 } },
        select: { failedAttempts: true },
      });
      const remaining = ACCESS_CODE_MAX_ATTEMPTS - updated.failedAttempts;
      if (remaining <= 0) {
        await prisma.clientAccessSession.update({
          where: { id: session.id },
          data: { expiresAt: now },
        });
        return NextResponse.json(
          { error: "Too many incorrect attempts. Please request a new code." },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` },
        { status: 401 }
      );
    }

    // Consume the code atomically — a concurrent replay of the same code
    // finds usedAt already set and fails.
    const consumed = await prisma.clientAccessSession.updateMany({
      where: {
        id: session.id,
        usedAt: null,
        expiresAt: { gt: now },
        failedAttempts: { lt: ACCESS_CODE_MAX_ATTEMPTS },
      },
      data: { usedAt: now },
    });
    if (consumed.count !== 1) {
      return NextResponse.json({ error: INVALID }, { status: 401 });
    }

    await setClientSessionCookie({
      clientId: client.id,
      email: client.email,
      name: client.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login verify-code error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
