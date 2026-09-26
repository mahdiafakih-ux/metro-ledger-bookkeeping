import { NextRequest, NextResponse } from "next/server";
import { isStripeConfigured } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { authorizeBusinessManager } from "@/lib/business-auth";
import { changeBusinessSubscriptionPlan } from "@/lib/subscriptions";
import { isSubscriptionPlanKey } from "@/lib/plans";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * Switch a business between Business10 and Business30.
 * Body: { businessId: string, planKey: "business10" | "business30" }
 * Auth: admin, or portal client with owner/admin role on the business.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
    }
    const ip = await getClientIp();
    if (!rateLimit(`plan-change:${ip}`, 10, 10 * 60 * 1000).allowed) {
      return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const businessId = typeof body?.businessId === "string" ? body.businessId : "";
    const planKey: unknown = body?.planKey;
    if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
    if (planKey === "unlimited") {
      return NextResponse.json({ error: "Business Unlimited is no longer available." }, { status: 410 });
    }
    if (!isSubscriptionPlanKey(planKey)) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    const auth = await authorizeBusinessManager(businessId);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { stripeSubscriptionId: true, currentPlanKey: true },
    });
    if (!business?.stripeSubscriptionId) {
      return NextResponse.json({ error: "No active subscription to change. Start a plan instead." }, { status: 409 });
    }
    if (business.currentPlanKey === planKey) {
      return NextResponse.json({ error: "Already on this plan" }, { status: 409 });
    }

    const result = await changeBusinessSubscriptionPlan({
      stripeSubscriptionId: business.stripeSubscriptionId,
      newPlanKey: planKey,
      businessId,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, planKey });
  } catch (error) {
    console.error("Plan change error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
