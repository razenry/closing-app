import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/session";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const since = searchParams.get("since");
    const closingId = searchParams.get("closingId");

    const sinceDate = since ? new Date(since) : null;
    const isValidSince = sinceDate && !isNaN(sinceDate.getTime());

    // 1. Fetch unread notifications
    const unreadCountPromise = prisma.notification.count({
      where: {
        userId: user.id,
        read: false,
      },
    });

    // 2. Fetch new notifications created since client's last poll
    const newNotificationsPromise = isValidSince
      ? prisma.notification.findMany({
        where: {
          userId: user.id,
          createdAt: { gt: sinceDate },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
      : Promise.resolve([]);

    // 3. Fetch closing status and updatedAt if currently viewing a closing
    const closingCheckPromise =
      closingId && closingId !== "new"
        ? prisma.closing.findUnique({
          where: { id: closingId },
          select: {
            id: true,
            status: true,
            updatedAt: true,
          },
        })
        : Promise.resolve(null);

    // 4. Fetch latest closing timestamp in user's scope (for dashboard/closings list sync)
    const globalClosingCheckPromise = prisma.closing.findFirst({
      where:
        user.role === Role.STAFF_CABANG && user.branchId
          ? { branchId: user.branchId }
          : {},
      orderBy: { updatedAt: "desc" },
      select: {
        updatedAt: true,
      },
    });

    const [unreadCount, newNotifications, currentClosing, latestGlobalClosing] =
      await Promise.all([
        unreadCountPromise,
        newNotificationsPromise,
        closingCheckPromise,
        globalClosingCheckPromise,
      ]);

    return NextResponse.json(
      {
        success: true,
        serverTime: new Date().toISOString(),
        unreadCount,
        newNotifications,
        closingUpdatedAt: currentClosing?.updatedAt?.toISOString() || null,
        closingStatus: currentClosing?.status || null,
        lastGlobalUpdate: latestGlobalClosing?.updatedAt?.toISOString() || null,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error: any) {
    console.error("Realtime sync error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
