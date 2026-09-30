"use server";

import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";

// Not admin-gated: also called from unauthenticated public flows (booking,
// business inquiry) to notify the admin of new activity.
export async function createNotification(input: { type: string; title: string; body?: string; link?: string }) {
  return prisma.notification.create({
    data: {
      type: input.type,
      title: input.title,
      body: input.body ?? "",
      link: input.link ?? "",
    },
  });
}

export async function getUnreadNotifications(limit = 20) {
  const session = await requireAdminSession();
  if (!session) return [];

  return prisma.notification.findMany({
    where: { isRead: false },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getRecentNotifications(limit = 20) {
  const session = await requireAdminSession();
  if (!session) return [];

  return prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function markNotificationRead(id: string) {
  const session = await requireAdminSession();
  if (!session) return;

  await prisma.notification.update({ where: { id }, data: { isRead: true } });
}

export async function markAllNotificationsRead() {
  const session = await requireAdminSession();
  if (!session) return;

  await prisma.notification.updateMany({ where: { isRead: false }, data: { isRead: true } });
}
