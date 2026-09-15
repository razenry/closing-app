"use client";

import React, { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { playNotificationSound } from "@/lib/audio";
import { AuthUser } from "@/lib/permissions";

interface RealtimeProviderProps {
  user: AuthUser;
  children: React.ReactNode;
}

/**
 * Trigger an immediate real-time sync across all components and open tabs
 */
export function triggerRealtimeAction() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("realtime:action"));
  try {
    const bc = new BroadcastChannel("closing_realtime_sync");
    bc.postMessage({ type: "ACTION_PERFORMED", timestamp: Date.now() });
    bc.close();
  } catch {
    // BroadcastChannel unsupported or restricted
  }
}

export function RealtimeProvider({ user, children }: RealtimeProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const lastCheckTimeRef = useRef<string>(new Date().toISOString());
  const lastClosingUpdatedAtRef = useRef<string | null>(null);
  const lastGlobalUpdateRef = useRef<string | null>(null);
  const isInitialSyncDone = useRef<boolean>(false);
  const isPollingRef = useRef<boolean>(false);

  // Extract closingId if user is on a detail page: /closings/[id]
  const closingIdMatch = pathname.match(/^\/closings\/([^\/]+)$/);
  const activeClosingId =
    closingIdMatch && closingIdMatch[1] !== "new" ? closingIdMatch[1] : null;

  const performSync = async () => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;

    try {
      const params = new URLSearchParams();
      params.set("since", lastCheckTimeRef.current);
      if (activeClosingId) {
        params.set("closingId", activeClosingId);
      }

      const res = await fetch(`/api/realtime/sync?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        isPollingRef.current = false;
        return;
      }

      const data = await res.json();
      if (!data.success) {
        isPollingRef.current = false;
        return;
      }

      // Update timestamp for next check
      if (data.serverTime) {
        lastCheckTimeRef.current = data.serverTime;
      }

      // 1. Handle New Notifications
      if (data.newNotifications && data.newNotifications.length > 0) {
        // Play notification audio
        playNotificationSound();

        // Show toast alerts for each notification
        data.newNotifications.forEach((notif: any) => {
          toast.info(notif.title, {
            description: notif.message,
            duration: 6000,
            action: notif.link
              ? {
                  label: "Lihat",
                  onClick: () => router.push(notif.link),
                }
              : undefined,
          });
        });

        // Broadcast to NotificationBell to update badge & dropdown immediately
        window.dispatchEvent(
          new CustomEvent("realtime:notifications", {
            detail: {
              unreadCount: data.unreadCount,
              newNotifications: data.newNotifications,
            },
          })
        );
      } else if (typeof data.unreadCount === "number") {
        window.dispatchEvent(
          new CustomEvent("realtime:unreadCount", {
            detail: { unreadCount: data.unreadCount },
          })
        );
      }

      // 2. Handle Real-time Screen Updates
      if (!isInitialSyncDone.current) {
        // First run: just record initial timestamps without refreshing
        lastClosingUpdatedAtRef.current = data.closingUpdatedAt;
        lastGlobalUpdateRef.current = data.lastGlobalUpdate;
        isInitialSyncDone.current = true;
      } else {
        let shouldRefresh = false;

        // If viewing a specific closing and it changed
        if (activeClosingId && data.closingUpdatedAt) {
          if (
            lastClosingUpdatedAtRef.current &&
            data.closingUpdatedAt !== lastClosingUpdatedAtRef.current
          ) {
            shouldRefresh = true;
          }
          lastClosingUpdatedAtRef.current = data.closingUpdatedAt;
        }

        // If on dashboard or closing list and a closing was updated in the system
        if (
          (pathname === "/dashboard" || pathname === "/closings") &&
          data.lastGlobalUpdate
        ) {
          if (
            lastGlobalUpdateRef.current &&
            data.lastGlobalUpdate !== lastGlobalUpdateRef.current
          ) {
            shouldRefresh = true;
          }
          lastGlobalUpdateRef.current = data.lastGlobalUpdate;
        }

        if (shouldRefresh) {
          router.refresh();
        }
      }
    } catch (err) {
      // Network hiccup, retry next interval
    } finally {
      isPollingRef.current = false;
    }
  };

  useEffect(() => {
    // Initial sync
    performSync();

    // Fast polling: 3.5s when active, 12s when backgrounded
    let timer: NodeJS.Timeout;

    const schedulePoll = () => {
      const isVisible = document.visibilityState === "visible";
      const interval = isVisible ? 3500 : 12000;
      timer = setTimeout(async () => {
        await performSync();
        schedulePoll();
      }, interval);
    };

    schedulePoll();

    // Listen to tab visibility change (sync immediately on tab focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        performSync();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Listen to local actions performed in this tab
    const handleLocalAction = () => {
      performSync();
      router.refresh();
    };
    window.addEventListener("realtime:action", handleLocalAction);

    // Listen to cross-tab actions via BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("closing_realtime_sync");
      bc.onmessage = (event) => {
        if (event.data?.type === "ACTION_PERFORMED") {
          performSync();
          router.refresh();
        }
      };
    } catch {
      // BroadcastChannel unavailable
    }

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("realtime:action", handleLocalAction);
      if (bc) {
        bc.close();
      }
    };
  }, [pathname, activeClosingId, router]);

  return <>{children}</>;
}
