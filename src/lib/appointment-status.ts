// Appointment status transition — the single implementation shared by the
// admin Server Action (after requireAdminSession) and the private AI operator
// route (after Bearer auth). Callers are responsible for authorization.

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { syncRevenueForAppointment } from "@/lib/payments";
import { syncBusinessUsageSafe } from "@/lib/usage";

export async function applyAppointmentStatus(id: string, status: string) {
  const before = await prisma.appointment.findUnique({ where: { id } });
  await prisma.appointment.update({
    where: { id },
    data: {
      status,
      completedAt: status === "completed" ? (before?.status === "completed" ? before.completedAt ?? new Date() : new Date()) : null,
    },
  });
  await syncRevenueForAppointment(id);
  await syncBusinessUsageSafe(before?.businessId);

  if (before && status === "cancelled" && before.status !== "cancelled" && before.email) {
    const { sendAppointmentCancelledEmail } = await import("@/lib/email");
    await sendAppointmentCancelledEmail({
      to: before.email,
      name: before.clientName,
      confirmationNumber: before.confirmationNumber,
      serviceType: before.serviceType,
      scheduledStart: before.scheduledStart,
    });
  }

  revalidatePath("/admin/appointments");
  revalidatePath(`/admin/appointments/${id}`);
  revalidatePath("/admin/calendar");
  revalidatePath("/admin");
  revalidatePath("/admin/goal");
  revalidatePath("/portal", "layout");
}
