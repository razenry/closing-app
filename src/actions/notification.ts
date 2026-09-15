"use server";

import { getCurrentUser } from "@/lib/session";
import { NotificationService } from "@/modules/notification/notification.service";
import { revalidatePath } from "next/cache";

export async function getNotificationsAction() {
  const user = await getCurrentUser();
  if (!user) {
    return { notifications: [], unreadCount: 0 };
  }

  try {
    const [notifications, unreadCount] = await Promise.all([
      NotificationService.listNotifications(user.id, 25),
      NotificationService.getUnreadCount(user.id),
    ]);

    return { notifications, unreadCount };
  } catch (err: any) {
    console.error("Error fetching notifications:", err);
    return { notifications: [], unreadCount: 0 };
  }
}

export async function markNotificationAsReadAction(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false };

  try {
    await NotificationService.markAsRead(notificationId, user.id);
    revalidatePath("/dashboard");
    revalidatePath("/closings");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function markAllNotificationsAsReadAction() {
  const user = await getCurrentUser();
  if (!user) return { success: false };

  try {
    await NotificationService.markAllAsRead(user.id);
    revalidatePath("/dashboard");
    revalidatePath("/closings");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
