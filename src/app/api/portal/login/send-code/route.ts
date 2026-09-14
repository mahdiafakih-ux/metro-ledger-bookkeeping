import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateAccessCode, hashAccessCode } from "@/lib/client-auth";
import { sendLoginCodeEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const client = await prisma.client.findFirst({
      where: { email: normalizedEmail },
    });

    if (!client) {
      // Generic response so callers cannot determine whether an account exists.
      return NextResponse.json({
        success: true,
        message: "If an account exists for that email, an access code has been sent.",
      });
    }

    const code = generateAccessCode();
    const codeHash = await hashAccessCode(code);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.clientAccessSession.create({
      data: {
        clientId: client.id,
        email: client.email,
        codeHash,
        expiresAt,
        ipAddress: request.headers.get("x-forwarded-for") || "",
      },
    });

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

    return NextResponse.json({
      success: true,
      message: "Access code sent.",
    });
  } catch (error) {
    console.error("Login send-code error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
