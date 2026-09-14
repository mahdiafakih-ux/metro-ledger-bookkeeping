import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateAccessCode, hashAccessCode } from "@/lib/client-auth";
import { sendLoginCodeEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find client by email
    const client = await prisma.client.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (!client) {
      // Don't reveal whether email exists for security
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Generate access code
    const code = generateAccessCode();
    const codeHash = await hashAccessCode(code);

    // Store access session
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await prisma.clientAccessSession.create({
      data: {
        clientId: client.id,
        email: client.email,
        codeHash,
        expiresAt,
        ipAddress: request.headers.get("x-forwarded-for") || "",
      },
    });

    // Send email with code
    await sendLoginCodeEmail({
      to: client.email,
      name: client.name,
      code,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login send-code error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
