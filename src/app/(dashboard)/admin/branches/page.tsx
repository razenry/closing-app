import React from "react";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { AdminService } from "@/modules/admin/admin.service";
import { BranchListView } from "@/components/admin/BranchListView";
import { Building2, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";

export default async function AdminBranchesPage() {
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
            Menu Master Data Cabang hanya dapat diakses oleh akun Kantor Pusat.
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

  const branches = await AdminService.listBranchesWithStats();

  const totalBranches = branches.length;
  const activeBranches = branches.filter((b) => b.active).length;
  const inactiveBranches = totalBranches - activeBranches;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
          <span>Master Data</span>
          <span>/</span>
          <span className="font-semibold text-slate-700">Cabang</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Data Cabang
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Kelola cabang operasional, kode identitas, dan status keaktifan cabang.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500">Total Cabang</span>
            <div className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">{totalBranches}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Cabang Aktif Beroperasi</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{activeBranches}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Cabang Nonaktif / Arsip</span>
            <div className="text-2xl font-bold text-slate-500 mt-1">{inactiveBranches}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-500">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Interactive Branch List */}
      <BranchListView initialBranches={branches as any} />
    </div>
  );
}
