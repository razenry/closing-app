"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  ShieldCheck,
  Building2,
  Users,
} from "lucide-react";
import { AuthUser } from "@/lib/permissions";
import { Role } from "@prisma/client";

interface SidebarProps {
  user: AuthUser;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const isStaffPusat = user.role === Role.STAFF_PUSAT;

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      href: "/closings",
      label: "Riwayat Closing",
      icon: FileText,
      active:
        pathname === "/closings" ||
        (pathname.startsWith("/closings/") && pathname !== "/closings/new"),
    },
    ...(user.role === Role.STAFF_CABANG
      ? [
          {
            href: "/closings/new",
            label: "Buat Closing Baru",
            icon: PlusCircle,
            active: pathname === "/closings/new",
          },
        ]
      : []),
  ];

  const adminNavItems = [
    {
      href: "/admin/branches",
      label: "Master Cabang",
      icon: Building2,
      active: pathname.startsWith("/admin/branches"),
    },
    {
      href: "/admin/users",
      label: "Master Pengguna & Akun",
      icon: Users,
      active: pathname.startsWith("/admin/users"),
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col min-h-[calc(100vh-61px)] p-4">
      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                item.active
                  ? "bg-amber-500 text-slate-900 font-semibold shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Admin Master Data Section (Staff Pusat Only) */}
      {isStaffPusat && (
        <div className="mt-6 pt-4 border-t border-slate-100">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Pengaturan & Master Data
          </div>
          <div className="space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    item.active
                      ? "bg-indigo-600 text-white font-semibold shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-slate-100 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 mb-1 text-slate-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Verifikasi Standar Logam Mulia</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Sistem internal dokumentasi harian cabang dan verifikasi kantor pusat.
        </p>
      </div>
    </aside>
  );
}
