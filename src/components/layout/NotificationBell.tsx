"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Clock,
  X,
  ExternalLink,
} from "lucide-react";
import {
  getNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from "@/actions/notification";
import { formatDateTime } from "@/lib/utils";

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: Date | string;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const res = await getNotificationsAction();
      setNotifications(res.notifications as any);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Listen to real-time notifications emitted by RealtimeProvider
    const handleRealtimeNotifs = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        if (typeof customEvent.detail.unreadCount === "number") {
          setUnreadCount(customEvent.detail.unreadCount);
        }
        if (customEvent.detail.newNotifications && customEvent.detail.newNotifications.length > 0) {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const fresh = customEvent.detail.newNotifications.filter(
              (n: any) => !existingIds.has(n.id)
            );
            return [...fresh, ...prev];
          });
        }
      }
    };

    const handleUnreadCount = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.unreadCount === "number") {
        setUnreadCount(customEvent.detail.unreadCount);
      }
    };

    window.addEventListener("realtime:notifications", handleRealtimeNotifs);
    window.addEventListener("realtime:unreadCount", handleUnreadCount);

    // Fast polling fallback every 6 seconds
    const interval = setInterval(fetchNotifications, 6000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("realtime:notifications", handleRealtimeNotifs);
      window.removeEventListener("realtime:unreadCount", handleUnreadCount);
    };
  }, []);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsReadAction();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      await markNotificationAsReadAction(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const getIcon = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes("revisi")) {
      return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    }
    if (lower.includes("verifikasi") || lower.includes("disetujui")) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }
    return <FileText className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        title="Notifikasi"
        aria-label="Notifikasi"
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Popover */}
      {isOpen && (
        <div className="fixed sm:absolute right-2 sm:right-0 top-14 sm:top-full mt-2 w-[calc(100vw-1rem)] sm:w-96 max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 px-4 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Notifikasi</h3>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                  {unreadCount} baru
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium">
                  Semua terbaca
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-medium text-amber-700 hover:text-amber-800 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Tandai Dibaca</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors sm:hidden"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center text-slate-400">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600 text-xs">Belum Ada Notifikasi</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Setiap pembaruan status closing dan permintaan revisi akan muncul di sini.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 px-4 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer relative ${
                    !notif.read ? "bg-amber-50/30" : ""
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                    {getIcon(notif.title)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs truncate ${
                          !notif.read
                            ? "font-bold text-slate-900"
                            : "font-semibold text-slate-700"
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1.5">
                      <Clock className="w-3 h-3" />
                      <span>{formatDateTime(new Date(notif.createdAt))}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <Link
              href="/closings"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-semibold text-slate-600 hover:text-amber-700 transition-colors"
            >
              Lihat Seluruh Riwayat Closing &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
