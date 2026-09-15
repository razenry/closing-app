"use client";

import React, { useState, useTransition } from "react";
import { AuthUser } from "@/lib/permissions";
import { Role } from "@prisma/client";
import { logoutAction } from "@/actions/auth";
import { UserCircle2, LogOut, KeyRound } from "lucide-react";
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal";
import { NotificationBell } from "@/components/layout/NotificationBell";

interface NavbarProps {
  user: AuthUser;
}

export function Navbar({ user }: NavbarProps) {
  const [isPending, startTransition] = useTransition();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-500 text-slate-900 font-bold text-base sm:text-lg shadow-xs shrink-0">
            LM
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
              <span className="sm:hidden">Closing LM</span>
              <span className="hidden sm:inline">Sistem Dokumentasi & Verifikasi Closing</span>
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Portal Internal Closing Logam Mulia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Notification Bell */}
          <NotificationBell />

          {/* User Scope & Role Indicator */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-200 text-xs">
            <UserCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
            <div className="text-left hidden md:block">
              <div className="font-semibold text-slate-800 text-xs">{user.name}</div>
              <div className="text-[11px] text-slate-500">
                {user.email}
              </div>
            </div>
            <span
              className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold ${
                user.role === Role.STAFF_PUSAT
                  ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                  : "bg-amber-100 text-amber-800 border border-amber-200"
              }`}
            >
              {user.role === Role.STAFF_PUSAT ? "PUSAT" : "CABANG"}
            </span>
          </div>

          {/* Change Password Button (Hidden on tiny screens since it's on bottom nav, visible on sm) */}
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-amber-800 hover:bg-amber-50 rounded-lg border border-slate-200 hover:border-amber-300 transition-colors cursor-pointer"
            title="Ganti Kata Sandi"
          >
            <KeyRound className="w-4 h-4 text-amber-600" />
            <span>Ganti Password</span>
          </button>

          {/* Secure Logout Button */}
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title="Keluar dari Sistem"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>


      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  );
}

