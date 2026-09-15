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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <span>Pengaturan & Master Data</span>
          <span>/</span>
          <span className="font-semibold text-slate-700">Master Data Pengguna & Akun</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Manajemen Master Pengguna & Akun
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Kelola akun staf cabang dan staf pusat, penugasan cabang, reset kata sandi, serta hak akses login.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Total Pengguna</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totalUsers}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Kantor Pusat</span>
            <div className="text-2xl font-bold text-indigo-600 mt-1">{staffPusatCount}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Staff Cabang</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">{staffCabangCount}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Akun Aktif</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{activeUsersCount}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Interactive User List */}
      <UserListView initialUsers={users as any} branches={branches} />
    </div>
  );
}
