"use server";

import { prisma } from "@/lib/db";
import { businessInquirySchema } from "@/lib/validation";
import { createNotification } from "@/lib/actions/notifications";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export interface BusinessInquiryResult {
  success: boolean;
  error?: string;
}

/**
 * Public, unauthenticated entry point for the Business Solutions inquiry
 * form. Creates a real Business + linked PipelineOpportunity right away
 * (rather than just a generic lead) so it shows up immediately in the B2B
 * CRM and sales pipeline for follow-up.
 */
export async function submitBusinessInquiry(input: unknown): Promise<BusinessInquiryResult> {
  const ip = await getClientIp();
  const { allowed } = rateLimit(`business-inquiry:${ip}`, 5, 60 * 60 * 1000);
  if (!allowed) return { success: false, error: "Too many submissions. Please try again later or call us directly." };

  const parsed = businessInquirySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check your input." };
  }
  const data = parsed.data;

  const existing = await prisma.business.findFirst({ where: { companyName: data.companyName } });
  const business = existing
    ? await prisma.business.update({
        where: { id: existing.id },
        data: {
          contactName: data.contactName,
          email: data.email,
          phone: data.phone,
          expectedMonthlyVolume: data.expectedMonthlyVolume,
          notes: existing.notes ? `${existing.notes}\n\n[New inquiry] ${data.message}` : data.message,
        },
      })
    : await prisma.business.create({
        data: {
          companyName: data.companyName,
          category: data.category,
          contactName: data.contactName,
          email: data.email,
          phone: data.phone,
          expectedMonthlyVolume: data.expectedMonthlyVolume,
          notes: data.message,
          status: "lead",
          leadSource: "website",
          followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
      });

  const existingOpportunity = await prisma.pipelineOpportunity.findFirst({ where: { businessId: business.id, stage: { notIn: ["won", "lost"] } } });
  if (!existingOpportunity) {
    await prisma.pipelineOpportunity.create({
      data: {
        businessName: data.companyName,
        contactName: data.contactName,
        category: data.category,
        stage: "new_lead",
        probability: 15,
        nextAction: "Reach out to discuss notary needs",
        nextFollowUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        notes: data.message,
        businessId: business.id,
      },
    });
  }

  await createNotification({
    type: "new_booking",
    title: "New business inquiry",
    body: `${data.companyName} — ${data.contactName} (~${data.expectedMonthlyVolume} appts/mo)`,
    link: `/admin/businesses/${business.id}`,
  });

  const { sendBusinessLeadConfirmationEmail } = await import("@/lib/email");
  await sendBusinessLeadConfirmationEmail({ to: data.email, name: data.contactName, company: data.companyName });

  return { success: true };
}
