import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendAppointmentReminderEmail } from "@/lib/email";

// Intended to be hit once daily by a scheduled job (Vercel Cron or similar).
// Finds appointments happening in roughly 24-48 hours that haven't had a
// reminder sent yet, emails each one, and stamps reminderSentAt so a retry
// or a second cron trigger the same day never double-sends.
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + 20 * 60 * 60 * 1000); // ~20h out
  const windowEnd = new Date(now.getTime() + 32 * 60 * 60 * 1000); // ~32h out

  const dueAppointments = await prisma.appointment.findMany({
    where: {
      status: "scheduled",
      reminderSentAt: null,
      scheduledStart: { gte: windowStart, lte: windowEnd },
      email: { not: "" },
    },
  });

  let sent = 0;
  let failed = 0;
  for (const appt of dueAppointments) {
    const result = await sendAppointmentReminderEmail({
      to: appt.email,
      name: appt.clientName,
      appointmentId: appt.id,
      confirmationNumber: appt.confirmationNumber,
      serviceType: appt.serviceType,
      scheduledStart: appt.scheduledStart,
    });
    if (result.success) {
      await prisma.appointment.update({ where: { id: appt.id }, data: { reminderSentAt: now } });
      sent++;
    } else {
      failed++;
    }
  }

  return NextResponse.json({ checked: dueAppointments.length, sent, failed });
}
