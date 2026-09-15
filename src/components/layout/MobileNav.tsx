"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  KeyRound,
  Building2,
  Users,
} from "lucide-react";
import { AuthUser } from "@/lib/permissions";
import { Role } from "@prisma/client";
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal";

interface MobileNavProps {
  user: AuthUser;
}

export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const isStaffCabang = user.role === Role.STAFF_CABANG;
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
      label: "Closing",
      icon: FileText,
      active:
        pathname === "/closings" ||
        (pathname.startsWith("/closings/") && pathname !== "/closings/new"),
    },
    ...(isStaffCabang
      ? [
          {
            href: "/closings/new",
            label: "Buat Baru",
            icon: PlusCircle,
            active: pathname === "/closings/new",
          },
        ]
      : [
          {
            href: "/admin/branches",
            label: "Cabang",
            icon: Building2,
            active: pathname.startsWith("/admin/branches"),
          },
          {
            href: "/admin/users",
            label: "User",
            icon: Users,
            active: pathname.startsWith("/admin/users"),
          },
        ]),
  ];

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-lg safe-area-bottom">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
                  item.active
                    ? "text-amber-600 font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <div
                  className={`p-1 rounded-lg ${
                    item.active ? "bg-amber-100 text-amber-700" : ""
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
          >
            <div className="p-1 rounded-lg">
              <KeyRound className="w-5 h-5 text-slate-500" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Sandi</span>
          </button>
        </div>
      </nav>

      {/* Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  );
}
