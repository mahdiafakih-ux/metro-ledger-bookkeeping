import { NextResponse } from "next/server";
import { isStripeConfigured } from "@/lib/stripe";
import { getStripePortalUrl } from "@/lib/subscriptions";
import { requireClientSession } from "@/lib/client-auth";
import { prisma } from "@/lib/db";
import { getPortalAccount } from "@/lib/portal/account";

export async function POST() {
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

    // SECURITY: Derive the Stripe customer server-side from the session.
    // Never trust a customerId from the browser (any body is ignored).
    const account = await getPortalAccount();

    let stripeCustomerId = "";
    if (account.plan.owner === "business" && account.business) {
      // Business subscriptions are managed by the business's owner/admin only.
      if (!account.canManageBilling) {
        return NextResponse.json(
          { error: "Only your account owner or admin can manage billing for your business." },
          { status: 403 }
        );
      }
      const business = await prisma.business.findUnique({
        where: { id: account.business.id },
        select: { stripeCustomerId: true },
      });
      stripeCustomerId = business?.stripeCustomerId ?? "";
    } else {
      const client = await prisma.client.findUnique({
        where: { id: clientSession.clientId },
        select: { stripeCustomerId: true },
      });
      stripeCustomerId = client?.stripeCustomerId ?? "";
    }

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "There's no saved billing profile on this account yet. Contact us and we'll set it up." },
        { status: 400 }
      );
    }

    const portalUrl = await getStripePortalUrl(stripeCustomerId);

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
