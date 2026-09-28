"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { isStripeConfigured } from "@/lib/stripe";
import {
  changeBusinessSubscriptionPlan,
  createBusinessSubscriptionCheckoutSession,
  createOverageInvoice,
  recomputeCurrentPeriodUsage,
} from "@/lib/subscriptions";
import { isSubscriptionPlanKey } from "@/lib/plans";

type Result<T = object> = ({ success: true } & T) | { success: false; error: string };

function refresh(businessId: string) {
  revalidatePath(`/admin/businesses/${businessId}`);
  revalidatePath("/admin/businesses");
}

const linkSchema = z.object({
  businessId: z.string().min(1),
  email: z.string().trim().toLowerCase().email().max(200),
  name: z.string().trim().max(120).optional().default(""),
  role: z.enum(["owner", "admin", "member", "viewer"]),
});

/** Give a person portal access to a business (creates their client record if needed). */
export async function linkBusinessPortalUser(input: z.input<typeof linkSchema>): Promise<Result> {
  if (!(await requireAdminSession())) return { success: false, error: "Unauthorized" };
  const parsed = linkSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Enter a valid email address." };
  const { businessId, email, name, role } = parsed.data;

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return { success: false, error: "Business not found" };

  let client = await prisma.client.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (!client) {
    client = await prisma.client.create({
      data: {
        name: name || business.contactName || email,
        email,
        company: business.companyName,
        clientType: "small_business",
        leadStatus: "active_client",
        leadSource: "business_account",
      },
    });
  }
  await prisma.businessClient.upsert({
    where: { businessId_clientId: { businessId, clientId: client.id } },
    update: { role },
    create: { businessId, clientId: client.id, role },
  });
  refresh(businessId);
  return { success: true };
}

export async function unlinkBusinessPortalUser(linkId: string): Promise<Result> {
  if (!(await requireAdminSession())) return { success: false, error: "Unauthorized" };
  const link = await prisma.businessClient.findUnique({ where: { id: linkId } });
  if (!link) return { success: false, error: "Not found" };
  await prisma.businessClient.delete({ where: { id: linkId } });
  refresh(link.businessId);
  return { success: true };
}

/** Create a Stripe Checkout link the admin can open or send to the client. */
export async function createBusinessCheckoutLink(businessId: string, planKey: string): Promise<Result<{ url: string }>> {
  if (!(await requireAdminSession())) return { success: false, error: "Unauthorized" };
  if (!isSubscriptionPlanKey(planKey)) return { success: false, error: "Choose Business10 or Business30." };
  if (!isStripeConfigured()) return { success: false, error: "Stripe is not configured." };

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return { success: false, error: "Business not found" };
  if (business.stripeSubscriptionId && ["active", "past_due", "incomplete"].includes(business.subscriptionStatus)) {
    return { success: false, error: "This business already has a subscription — use Change Plan." };
  }
  const email = business.billingContactEmail || business.email;
  if (!email) return { success: false, error: "Add a billing or contact email to this business first." };

  const session = await createBusinessSubscriptionCheckoutSession({
    planKey,
    businessId,
    businessEmail: email,
    businessName: business.companyName,
    existingCustomerId: business.stripeCustomerId || undefined,
  });
  if (!session?.url) {
    return { success: false, error: `Could not create checkout. Check that the Stripe price env var for ${planKey} is set.` };
  }
  if (!business.stripeCustomerId && session.customerId) {
    await prisma.business.update({ where: { id: businessId }, data: { stripeCustomerId: session.customerId } });
  }
  return { success: true, url: session.url };
}

export async function changeBusinessPlanAdmin(businessId: string, planKey: string): Promise<Result> {
  if (!(await requireAdminSession())) return { success: false, error: "Unauthorized" };
  if (!isSubscriptionPlanKey(planKey)) return { success: false, error: "Choose Business10 or Business30." };
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business?.stripeSubscriptionId) return { success: false, error: "No active subscription to change." };
  const result = await changeBusinessSubscriptionPlan({ stripeSubscriptionId: business.stripeSubscriptionId, newPlanKey: planKey, businessId });
  if (!result.ok) return { success: false, error: result.error };
  refresh(businessId);
  return { success: true };
}

export async function invoiceBusinessOverage(businessId: string): Promise<Result<{ invoiceId: string }>> {
  if (!(await requireAdminSession())) return { success: false, error: "Unauthorized" };
  const invoiceId = await createOverageInvoice({ businessId });
  if (!invoiceId) return { success: false, error: "No unbilled overage for this business." };
  refresh(businessId);
  revalidatePath("/admin/invoices");
  return { success: true, invoiceId };
}

export async function recomputeBusinessUsage(businessId: string): Promise<Result> {
  if (!(await requireAdminSession())) return { success: false, error: "Unauthorized" };
  await recomputeCurrentPeriodUsage(businessId);
  refresh(businessId);
  return { success: true };
}
