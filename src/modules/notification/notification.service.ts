import { prisma } from "@/lib/db/prisma";
import { Role } from "@prisma/client";

export class NotificationService {
  /**
   * Create a single notification for a specific user
   */
  static async createNotification(params: {
    userId: string;
    title: string;
    message: string;
    link?: string;
  }) {
    return prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        link: params.link,
      },
    });
  }

  /**
   * Notify all staff in a specific branch (e.g. when Pusat requests revision or verifies)
   */
  static async notifyBranchStaff(
    branchId: string,
    params: { title: string; message: string; link?: string }
  ) {
    const branchUsers = await prisma.user.findMany({
      where: {
        branchId,
        role: Role.STAFF_CABANG,
        active: true,
      },
      select: { id: true },
    });

    if (branchUsers.length === 0) return;

    await prisma.notification.createMany({
      data: branchUsers.map((u) => ({
        userId: u.id,
        title: params.title,
        message: params.message,
        link: params.link,
      })),
    });
  }

  /**
   * Notify Pusat staff authorized for a branch (e.g. when Cabang submits closing or fixes revision)
   */
  static async notifyPusatStaff(params: {
    title: string;
    message: string;
    link?: string;
    branchId?: string;
  }) {
    const pusatUsers = await prisma.user.findMany({
      where: {
        role: Role.STAFF_PUSAT,
        active: true,
      },
      select: { id: true, authorizedBranchIds: true },
    });

    // Filter by branch scope if branchId is specified
    const targetUsers = pusatUsers.filter((u) => {
      if (!params.branchId || !u.authorizedBranchIds) return true;
      const ids = u.authorizedBranchIds.split(",").map((s) => s.trim());
      return ids.includes(params.branchId);
    });

    if (targetUsers.length === 0) return;

    await prisma.notification.createMany({
      data: targetUsers.map((u) => ({
        userId: u.id,
        title: params.title,
        message: params.message,
        link: params.link,
      })),
    });
  }

  /**
   * List notifications for a user, sorted newest first
   */
  static async listNotifications(userId: string, limit = 20) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  /**
   * Mark a specific notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: { read: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: { read: true },
    });
  }
}
