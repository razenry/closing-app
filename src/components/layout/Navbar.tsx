"use client";

import React, { useState, useTransition } from "react";
import { AuthUser } from "@/lib/permissions";
import { Role } from "@prisma/client";
import { logoutAction } from "@/actions/auth";
import { UserCircle2, LogOut, KeyRound } from "lucide-react";
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal";

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
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500 text-slate-900 font-bold text-lg shadow-xs">
            LM
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">
              Sistem Dokumentasi & Verifikasi Closing
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              Portal Internal Closing Logam Mulia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Scope & Role Indicator */}
          <div className="flex items-center gap-2.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <UserCircle2 className="w-5 h-5 text-slate-500" />
            <div className="text-left hidden md:block">
              <div className="font-semibold text-slate-800">{user.name}</div>
              <div className="text-[11px] text-slate-500">
                {user.email}
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                user.role === Role.STAFF_PUSAT
                  ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                  : "bg-amber-100 text-amber-800 border border-amber-200"
              }`}
            >
              {user.role === Role.STAFF_PUSAT ? "KANTOR PUSAT" : "STAFF CABANG"}
            </span>
          </div>

          {/* Change Password Button */}
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-amber-800 hover:bg-amber-50 rounded-lg border border-slate-200 hover:border-amber-300 transition-colors cursor-pointer"
            title="Ganti Kata Sandi"
          >
            <KeyRound className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">Ganti Password</span>
          </button>

          {/* Secure Logout Button */}
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title="Keluar dari Sistem"
          >
            <LogOut className="w-4 h-4" />
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

