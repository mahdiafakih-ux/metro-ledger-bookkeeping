import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setClientSessionCookie, verifyAccessCode } from "@/lib/client-auth";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    // Find client
    const client = await prisma.client.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Find access session
    const session = await prisma.clientAccessSession.findFirst({
      where: {
        clientId: client.id,
        email: email.toLowerCase(),
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Code expired or not found" },
        { status: 401 }
      );
    }

    // Verify code
    const codeValid = await verifyAccessCode(code, session.codeHash);
    if (!codeValid) {
      return NextResponse.json(
        { error: "Invalid code" },
        { status: 401 }
      );
    }

    // Mark session as used
    await prisma.clientAccessSession.update({
      where: { id: session.id },
      data: { usedAt: new Date() },
    });

    // Create session cookie
    await setClientSessionCookie({
      clientId: client.id,
      email: client.email,
      name: client.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login verify-code error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
