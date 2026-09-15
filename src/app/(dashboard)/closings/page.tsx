import React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { ClosingService } from "@/modules/closing/closing.service";
import { BranchService } from "@/modules/branch/branch.service";
import { StatusBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { formatDate, formatDateTime } from "@/lib/utils";
import { ClosingStatus, Role } from "@prisma/client";
import { FileText, PlusCircle, Search, Filter, ArrowRight, Building2, Calendar } from "lucide-react";

interface ClosingsPageProps {
  searchParams: Promise<{
    branch?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
  }>;
}

export default async function ClosingsPage({ searchParams }: ClosingsPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const status = (params.status as ClosingStatus | "ALL") || "ALL";
  const branchId = params.branch || undefined;
  const startDate = params.startDate || undefined;
  const endDate = params.endDate || undefined;

  const [branches, { items: closings, total }] = await Promise.all([
    BranchService.listBranchesForUser(user),
    ClosingService.listClosings({
      user,
      branchId,
      status,
      startDate,
      endDate,
      page,
      pageSize: 15,
    }),
  ]);

  const totalPages = Math.ceil(total / 15) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Daftar & Riwayat Closing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pencarian dan peninjauan dokumentasi closing harian seluruh cabang yang berada dalam lingkup kewenangan Anda.
          </p>
        </div>

        {user.role === Role.STAFF_CABANG && (
          <Link
            href="/closings/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold text-xs shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buat Closing Baru</span>
          </Link>
        )}
      </div>

      {/* Filter Form */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Branch selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Cabang</label>
            <select
              name="branch"
              defaultValue={branchId || ""}
              disabled={user.role === Role.STAFF_CABANG}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs disabled:bg-slate-100"
            >
              {user.role === Role.STAFF_PUSAT && <option value="">Semua Cabang Wewenang</option>}
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Status selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Status Closing</label>
            <select
              name="status"
              defaultValue={status}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
            >
              <option value="ALL">Semua Status</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="REVISION_REQUIRED">REVISION_REQUIRED</option>
              <option value="VERIFIED">VERIFIED</option>
            </select>
          </div>

          {/* Date range start */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dari Tanggal</label>
            <input
              type="date"
              name="startDate"
              defaultValue={startDate || ""}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
            />
          </div>

          {/* Filter button */}
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="w-full py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Terapkan Filter</span>
            </button>
            <Link
              href="/closings"
              className="py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-medium text-center"
            >
              Reset
            </Link>
          </div>
        </form>
      </div>

      {/* Closings List / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Mobile View: Clean Touch-Friendly Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {closings.length === 0 ? (
            <div className="py-12 px-4 text-center text-slate-400">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-600">Tidak ada data closing ditemukan</p>
              <p className="text-[11px] text-slate-400">Coba ubah kata kunci filter atau buat closing baru.</p>
            </div>
          ) : (
            closings.map((closing) => (
              <Link
                key={closing.id}
                href={`/closings/${closing.id}`}
                className="p-4 flex flex-col gap-2.5 hover:bg-slate-50 active:bg-slate-100 transition-colors block"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm min-w-0">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{closing.branch.name}</span>
                  </div>
                  <StatusBadge status={closing.status} />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium text-slate-700">{formatDate(closing.closingDate)}</span>
                  <span>Oleh: {closing.createdBy.name}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Kelengkapan Dokumen</span>
                    <span className="font-bold text-slate-800">{closing.completenessPercentage}% (11 item)</span>
                  </div>
                  <ProgressBar percentage={closing.completenessPercentage} showText={false} />
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                  <span>Update: {formatDateTime(closing.updatedAt)}</span>
                  <span className="text-amber-600 font-semibold flex items-center gap-1">
                    Buka <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Desktop View: Full Data Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] bg-slate-50">
                <th className="py-3 px-4">Cabang</th>
                <th className="py-3 px-4">Tanggal Closing</th>
                <th className="py-3 px-4">Dibuat Oleh</th>
                <th className="py-3 px-4">Kelengkapan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Pembaruan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {closings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada data closing ditemukan</p>
                    <p className="text-[11px] text-slate-400">Coba ubah kata kunci filter atau buat closing baru.</p>
                  </td>
                </tr>
              ) : (
                closings.map((closing) => (
                  <tr key={closing.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{closing.branch.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {formatDate(closing.closingDate)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {closing.createdBy.name}
                    </td>
                    <td className="py-3 px-4 w-44">
                      <ProgressBar percentage={closing.completenessPercentage} showText={false} />
                      <span className="text-[10px] text-slate-500 font-semibold mt-0.5 inline-block">
                        {closing.completenessPercentage}% (11 Item)
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={closing.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {formatDateTime(closing.updatedAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/closings/${closing.id}`}
                        className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-800 font-semibold cursor-pointer"
                      >
                        Buka
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50">
            <span>
              Menampilkan {closings.length} dari total {total} closing
            </span>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/closings?page=${p}&branch=${branchId || ""}&status=${status}`}
                  className={`px-2.5 py-1 rounded border text-xs font-semibold ${
                    p === page
                      ? "bg-amber-500 text-slate-900 border-amber-500"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
