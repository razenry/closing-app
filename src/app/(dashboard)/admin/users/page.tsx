import React from "react";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { AdminService } from "@/modules/admin/admin.service";
import { BranchRepository } from "@/modules/branch/branch.repository";
import { UserListView } from "@/components/admin/UserListView";
import { Users, Shield, Building2, UserCheck, ShieldAlert } from "lucide-react";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Security authorization check: only STAFF_PUSAT
  if (user.role !== Role.STAFF_PUSAT) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800">
          <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <h2 className="text-base font-bold mb-1">Akses Ditolak (403 Unauthorized)</h2>
          <p className="text-xs text-red-600 mb-4">
            Menu Master Data Pengguna hanya dapat diakses oleh akun Kantor Pusat.
          </p>
          <a
            href="/dashboard"
            className="inline-block px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold"
          >
            Kembali ke Dashboard
          </a>
        </div>
      </div>
    );
  }

  const [users, branches] = await Promise.all([
    AdminService.listUsersWithRelations(),
    BranchRepository.listAll(),
  ]);

  const totalUsers = users.length;
  const staffPusatCount = users.filter((u) => u.role === Role.STAFF_PUSAT).length;
  const staffCabangCount = users.filter((u) => u.role === Role.STAFF_CABANG).length;
  const activeUsersCount = users.filter((u) => u.active).length;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header - Shortened & Compact */}
      <div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
          <span>Master Data</span>
          <span>/</span>
          <span className="font-semibold text-slate-700">Pengguna</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Data Pengguna
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Kelola staf cabang, staf pusat, dan hak akses login sistem.
        </p>
      </div>

      {/* Mini Metric Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Total</span>
          </div>
          <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
            {totalUsers}
          </span>
        </div>

        <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-medium">
            <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>Pusat</span>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
            {staffPusatCount}
          </span>
        </div>

        <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
            <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Cabang</span>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
            {staffCabangCount}
          </span>
        </div>

        <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Aktif</span>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            {activeUsersCount}
          </span>
        </div>
      </div>

      {/* Main Interactive User List */}
      <UserListView initialUsers={users as any} branches={branches} />
    </div>
  );
}
