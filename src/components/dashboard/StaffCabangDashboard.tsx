import React from "react";
import Link from "next/link";
import { AuthUser } from "@/lib/permissions";
import { StatusBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils";
import { ClosingStatus } from "@prisma/client";
import {
  Calendar,
  Building2,
  AlertTriangle,
  PlusCircle,
  ArrowRight,
  Send,
  History,
  CheckCircle2,
} from "lucide-react";

interface StaffCabangDashboardProps {
  user: AuthUser;
  todayClosing: any;
  recentClosings: any[];
}

export function StaffCabangDashboard({
  user,
  todayClosing,
  recentClosings,
}: StaffCabangDashboardProps) {
  const isRevision = todayClosing?.status === ClosingStatus.REVISION_REQUIRED;
  const isDraft = todayClosing?.status === ClosingStatus.DRAFT;
  const isComplete = (todayClosing?.completenessPercentage ?? 0) >= 100;

  // Latest revision note if active
  const latestRevision = todayClosing?.revisions?.[todayClosing.revisions.length - 1];

  return (
    <div className="space-y-6">
      {/* 1. Today's Closing Hero Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Closing Hari Ini</h2>
            <p className="text-xs text-slate-500">Status dan kelengkapan dokumen closing cabang hari ini.</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{formatDate(new Date())}</span>
          </div>
        </div>

        {todayClosing ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-800 text-sm">
                    {todayClosing.branch?.name || "Cabang Anda"}
                  </span>
                  <StatusBadge status={todayClosing.status} />
                </div>
                <div className="text-xs text-slate-500">
                  Tanggal Closing: <strong>{formatDate(todayClosing.closingDate)}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/closings/${todayClosing.id}`}
                  className="px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{isRevision ? "Perbaiki Revisi" : isDraft ? "Lanjutkan Closing" : "Lihat Detail"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Revision Note Alert */}
            {isRevision && latestRevision && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold mb-1">Catatan Revisi dari Kantor Pusat:</div>
                  <div className="italic">&ldquo;{latestRevision.note}&rdquo;</div>
                  <div className="mt-2 text-[11px] text-amber-700">
                    Silakan klik tombol &quot;Perbaiki Revisi&quot; di atas untuk membuka formulir dan memperbaiki dokumentasi yang diminta.
                  </div>
                </div>
              </div>
            )}

            {/* Completeness Bar */}
            <div className="pt-2">
              <ProgressBar percentage={todayClosing.completenessPercentage} />
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-50/60 rounded-xl border border-dashed border-slate-300">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 text-sm mb-1">
              Belum Ada Closing untuk Hari Ini
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Mulai pencatatan dokumen closing harian cabang Anda untuk memastikan seluruh stok fisik terverifikasi.
            </p>
            <Link
              href="/closings/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold text-xs shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Closing Hari Ini</span>
            </Link>
          </div>
        )}
      </div>

      {/* 2. Previous Closing History */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">Riwayat Closing Sebelumnya</h3>
          </div>
          <Link
            href="/closings"
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentClosings.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Belum ada riwayat closing sebelumnya.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] bg-slate-50">
                  <th className="py-2.5 px-3">Tanggal Closing</th>
                  <th className="py-2.5 px-3">Kelengkapan</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentClosings.map((closing) => (
                  <tr key={closing.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {formatDate(closing.closingDate)}
                    </td>
                    <td className="py-3 px-3 w-44">
                      <div className="w-full">
                        <ProgressBar percentage={closing.completenessPercentage} showText={false} />
                        <span className="text-[10px] text-slate-500 font-semibold mt-0.5 inline-block">
                          {closing.completenessPercentage}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={closing.status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/closings/${closing.id}`}
                        className="text-amber-600 hover:text-amber-800 font-semibold inline-flex items-center gap-1"
                      >
                        Detail
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
