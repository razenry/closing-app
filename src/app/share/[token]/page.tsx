import React from "react";
import Link from "next/link";
import { ShareService } from "@/modules/sharing/share.service";
import { getCurrentUser } from "@/lib/session";
import { StatusBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { formatDate, formatDateTime, formatFileSize } from "@/lib/utils";
import { GRAMMASI_LIST } from "@/modules/checklist/checklist.validation";
import { FileCategory, StockStatus } from "@prisma/client";
import {
  ShieldAlert,
  Building2,
  Calendar,
  Download,
  FileArchive,
  Image as ImageIcon,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Lock,
} from "lucide-react";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const currentUser = await getCurrentUser();
  const validation = await ShareService.validateToken(token);

  if (validation.status === "NOT_FOUND") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-800 mb-2">Tautan Tidak Ditemukan</h1>
          <p className="text-xs text-slate-500 mb-6">
            Tautan berbagi tidak valid atau token yang digunakan salah.
          </p>
          <Link
            href="/login"
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold"
          >
            Halaman Login Internal
          </Link>
        </div>
      </div>
    );
  }

  if (validation.status === "EXPIRED") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3 text-amber-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-800 mb-2">Tautan Telah Kedaluwarsa</h1>
          <p className="text-xs text-slate-500 mb-6">
            Masa berlaku tautan berbagi dokumen closing ini telah habis. Silakan hubungi Kantor Pusat atau staf cabang untuk mendapatkan tautan baru.
          </p>
          <Link
            href="/login"
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold"
          >
            Login Internal
          </Link>
        </div>
      </div>
    );
  }

  if (validation.status === "REVOKED") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3 text-red-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-800 mb-2">Tautan Telah Dicabut</h1>
          <p className="text-xs text-slate-500 mb-6">
            Akses publik untuk tautan dokumen ini telah dicabut secara manual oleh pihak yang berwenang.
          </p>
          <Link
            href="/login"
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold"
          >
            Login Internal
          </Link>
        </div>
      </div>
    );
  }

  const { closing } = validation;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Internal Authenticated User Notice Banner (Section 23) */}
        {currentUser && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Anda masuk sebagai internal <strong>{currentUser.name}</strong> ({currentUser.role}).
              </span>
            </div>
            <Link
              href={`/closings/${closing.id}`}
              className="font-bold underline hover:text-blue-700 flex items-center gap-1"
            >
              Buka di Panel Internal
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Public Header Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                Verifikasi Publik & Dokumentasi Closing
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {closing.branch.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tanggal: <strong>{formatDate(closing.closingDate)}</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Kode: {closing.branch.code}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-2">
              <StatusBadge status={closing.status} />
              <a
                href={`/api/files/closing/${closing.id}/download-all?token=${token}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs shadow-xs transition-colors"
              >
                <FileArchive className="w-4 h-4" />
                <span>Unduh Semua (.zip)</span>
              </a>
            </div>
          </div>

          <div className="mt-4 max-w-md">
            <ProgressBar percentage={closing.completenessPercentage} />
          </div>
        </div>

        {/* 1. Gramasi Checklist Overview (Read-Only) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-3">
            Ringkasan Stok Gramasi Fisik
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] bg-slate-50">
                  <th className="py-2.5 px-3">Gramasi</th>
                  <th className="py-2.5 px-3">Status Stok</th>
                  <th className="py-2.5 px-3">Dokumentasi Foto</th>
                  <th className="py-2.5 px-3 text-right">Kelengkapan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {GRAMMASI_LIST.map((gramasi) => {
                  const item = closing.checklists.find((c: any) => c.gramasi === gramasi);
                  const stockStatus = item?.stockStatus ?? StockStatus.NOT_SET;
                  const photo = closing.files.find(
                    (f: any) => f.category === FileCategory.STOCK_PHOTO && f.gramasi === gramasi
                  );
                  const isComplete =
                    stockStatus === StockStatus.NO_STOCK || (stockStatus === StockStatus.HAS_STOCK && photo);

                  return (
                    <tr key={gramasi} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{gramasi}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            stockStatus === StockStatus.HAS_STOCK
                              ? "bg-amber-100 text-amber-800"
                              : stockStatus === StockStatus.NO_STOCK
                              ? "bg-slate-200 text-slate-700"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {stockStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {photo ? (
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                            <span className="truncate max-w-[180px] font-medium text-slate-700">
                              {photo.originalFilename}
                            </span>
                            <a
                              href={`/api/files/${photo.id}/download?token=${token}`}
                              className="text-amber-600 hover:text-amber-800"
                              title="Unduh foto"
                            >
                              <Download className="w-3 h-3" />
                            </a>
                          </div>
                        ) : stockStatus === StockStatus.NO_STOCK ? (
                          <span className="text-slate-400 italic">Tanpa stok (Foto tidak wajib)</span>
                        ) : (
                          <span className="text-amber-600">Foto belum tersedia</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {isComplete ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Lengkap
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Belum Lengkap
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Main Documentation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Excel */}
          {(() => {
            const excel = closing.files.find((f: any) => f.category === FileCategory.STOCK_EXCEL);
            return (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Stock Excel File</h3>
                  </div>
                  {excel ? (
                    <div className="text-xs text-slate-600">
                      <div className="font-medium truncate">{excel.originalFilename}</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Ukuran: {formatFileSize(excel.size)}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">File Excel belum tersedia.</p>
                  )}
                </div>
                {excel && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                    <a
                      href={`/api/files/${excel.id}/download?token=${token}`}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh Excel
                    </a>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Recap Photo */}
          {(() => {
            const recap = closing.files.find((f: any) => f.category === FileCategory.RECAP_PHOTO);
            return (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-sm">Recap Photo</h3>
                  </div>
                  {recap ? (
                    <div className="text-xs text-slate-600">
                      <div className="font-medium truncate">{recap.originalFilename}</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Ukuran: {formatFileSize(recap.size)}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Foto rekapitulasi belum tersedia.</p>
                  )}
                </div>
                {recap && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                    <a
                      href={`/api/files/${recap.id}/download?token=${token}`}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh Foto Rekap
                    </a>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Security watermark footer */}
        <div className="text-center text-[11px] text-slate-400 py-4">
          Dokumen ini dilindungi secara kriptografis oleh Sistem Dokumentasi & Verifikasi Closing Logam Mulia.
        </div>
      </div>
    </div>
  );
}
