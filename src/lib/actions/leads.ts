"use server";

import { prisma } from "@/lib/db";
import { contactSchema } from "@/lib/validation";
import { createNotification } from "@/lib/actions/notifications";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export interface LeadResult {
  success: boolean;
  error?: string;
}

export async function submitLead(input: unknown): Promise<LeadResult> {
  const ip = await getClientIp();
  const { allowed } = rateLimit(`lead:${ip}`, 10, 60 * 60 * 1000);
  if (!allowed) return { success: false, error: "Too many submissions. Please try again later or call us directly." };

  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Please check your input." };
  }
  const data = parsed.data;

  await prisma.leadCapture.create({ data });

  if (data.isBusinessLead) {
    await prisma.pipelineOpportunity.create({
      data: {
        businessName: data.company || data.name,
        contactName: data.name,
        category: "other",
        stage: "new_lead",
        potentialMonthlyCents: 0,
        probability: 15,
        notes: `Website inquiry: ${data.message}${data.estimatedAppointmentsPerMonth ? ` | Est. appts/mo: ${data.estimatedAppointmentsPerMonth}` : ""}`,
      },
    });
  }

  await createNotification({
    type: "new_booking",
    title: data.isBusinessLead ? "New business partner inquiry" : "New contact form submission",
    body: `${data.name}${data.company ? ` (${data.company})` : ""} — ${data.serviceNeeded || "General inquiry"}`,
    link: "/admin/outreach",
  });

  if (data.email) {
    const { sendBusinessLeadConfirmationEmail } = await import("@/lib/email");
    await sendBusinessLeadConfirmationEmail({ to: data.email, name: data.name, company: data.company });
  }

  return { success: true };
}
