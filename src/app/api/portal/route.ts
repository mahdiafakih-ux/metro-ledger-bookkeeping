import { NextRequest, NextResponse } from "next/server";
import { isStripeConfigured, getStripeClient } from "@/lib/stripe";
import { getStripePortalUrl } from "@/lib/subscriptions";
import { requireClientSession } from "@/lib/client-auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 503 }
      );
    }

    // SECURITY: Require authenticated client portal session
    const clientSession = await requireClientSession();
    if (!clientSession) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // SECURITY: Derive stripeCustomerId from database using session clientId
    // Never trust customerId from the browser
    const client = await prisma.client.findUnique({
      where: { id: clientSession.clientId },
      select: { id: true, stripeCustomerId: true },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    if (!client.stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer associated with this account" },
        { status: 400 }
      );
    }

    const portalUrl = await getStripePortalUrl(client.stripeCustomerId);

    if (!portalUrl) {
      return NextResponse.json(
        { error: "Failed to create portal session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ portalUrl });
  } catch (error) {
    console.error("Portal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
