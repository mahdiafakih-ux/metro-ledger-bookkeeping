"use server";

import { prisma } from "@/lib/db";

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
  return prisma.notification.findMany({
    where: { isRead: false },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getRecentNotifications(limit = 20) {
  return prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function markNotificationRead(id: string) {
  await prisma.notification.update({ where: { id }, data: { isRead: true } });
}

export async function markAllNotificationsRead() {
  await prisma.notification.updateMany({ where: { isRead: false }, data: { isRead: true } });
}
