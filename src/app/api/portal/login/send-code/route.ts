import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ACCESS_CODE_TTL_MINUTES, generateAccessCode, hashAccessCode } from "@/lib/client-auth";
import { sendLoginCodeEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const bodySchema = z.object({ email: z.string().trim().toLowerCase().email().max(320) });

const GENERIC_OK = {
  success: true,
  message: "If an account exists for that email, an access code has been sent.",
};

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    const normalizedEmail = parsed.data.email;

    // Throttle code requests per IP and per email (best-effort, per instance).
    const ip = await getClientIp();
    const byIp = rateLimit(`portal-send:ip:${ip}`, 10, 60 * 60 * 1000);
    const byEmail = rateLimit(`portal-send:email:${normalizedEmail}`, 5, 15 * 60 * 1000);
    if (!byIp.allowed || !byEmail.allowed) {
      return NextResponse.json(
        { error: "Too many code requests. Please wait a few minutes and try again." },
        { status: 429 }
      );
    }

    const client = await prisma.client.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    });

    if (!client) {
      // Generic response so callers cannot determine whether an account exists.
      return NextResponse.json(GENERIC_OK);
    }

    const code = generateAccessCode();
    const codeHash = await hashAccessCode(code);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ACCESS_CODE_TTL_MINUTES * 60 * 1000);

    // Only the newest code is ever valid: retire any outstanding codes first.
    await prisma.$transaction([
      prisma.clientAccessSession.updateMany({
        where: { clientId: client.id, usedAt: null, expiresAt: { gt: now } },
        data: { expiresAt: now },
      }),
      prisma.clientAccessSession.create({
        data: {
          clientId: client.id,
          email: normalizedEmail,
          codeHash,
          expiresAt,
          ipAddress: ip === "unknown" ? "" : ip,
        },
      }),
    ]);

    const emailResult = await sendLoginCodeEmail({
      to: client.email,
      name: client.name,
      code,
    });

    if (!emailResult.success || emailResult.skipped) {
      console.error("Login code email was not sent:", emailResult);
      return NextResponse.json(
        { error: "Unable to send access code right now. Please try again." },
        { status: 503 }
      );
    }

    return NextResponse.json(GENERIC_OK);
  } catch (error) {
    console.error("Login send-code error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
