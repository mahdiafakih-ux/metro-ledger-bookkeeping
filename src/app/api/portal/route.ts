import { NextRequest, NextResponse } from "next/server";
import { isStripeConfigured } from "@/lib/stripe";
import { authorizeBusinessManager } from "@/lib/business-auth";
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

    // Business billing: the Stripe customer belongs to the business. Only a
    // linked owner/admin may open it; the customer ID comes from the DB.
    const body = await request.json().catch(() => ({}));
    const businessId = typeof body?.businessId === "string" ? body.businessId : "";
    if (businessId) {
      const auth = await authorizeBusinessManager(businessId);
      if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
      const business = await prisma.business.findUnique({ where: { id: businessId }, select: { stripeCustomerId: true } });
      if (!business?.stripeCustomerId) {
        return NextResponse.json({ error: "No billing account yet — start a plan first." }, { status: 400 });
      }
      const url = await getStripePortalUrl(business.stripeCustomerId);
      if (!url) return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
      return NextResponse.json({ portalUrl: url });
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
