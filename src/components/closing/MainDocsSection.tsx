"use client";

import React, { useState, useTransition } from "react";
import { AuthUser } from "@/lib/permissions";
import { ClosingWithRelations } from "@/modules/closing/closing.types";
import { FileCategory, Role, ClosingStatus } from "@prisma/client";
import { deleteFileAction } from "@/actions/file";
import { UploadModal } from "./UploadModal";
import { FileSpreadsheet, Image as ImageIcon, Download, Trash2, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { formatFileSize, formatDateTime } from "@/lib/utils";

interface MainDocsSectionProps {
  closing: ClosingWithRelations;
  currentUser: AuthUser;
}

export function MainDocsSection({ closing, currentUser }: MainDocsSectionProps) {
  const [uploadCategory, setUploadCategory] = useState<FileCategory | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEditable =
    currentUser.role === Role.STAFF_CABANG &&
    (closing.status === ClosingStatus.DRAFT || closing.status === ClosingStatus.REVISION_REQUIRED);

  const stockExcelFile = closing.files.find((f) => f.category === FileCategory.STOCK_EXCEL);
  const recapPhotoFile = closing.files.find((f) => f.category === FileCategory.RECAP_PHOTO);

  const handleDelete = (fileId: string) => {
    if (!confirm("Hapus file ini?")) return;
    startTransition(async () => {
      await deleteFileAction(fileId, closing.id);
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6 mb-6">
      <div className="pb-3 border-b border-slate-100 mb-4">
        <h2 className="text-base font-bold text-slate-900">
          Dokumentasi Utama Closing (Excel & Rekap)
        </h2>
        <p className="text-xs text-slate-500">
          Dua dokumen wajib closing: File Excel rekapitulasi stok dan Foto fisik rekapitulasi harian.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Stock Excel Card */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Stock Excel File</h3>
                  <p className="text-[11px] text-slate-500">Spreadsheet rekapitulasi (.xlsx, .xls)</p>
                </div>
              </div>
              {stockExcelFile ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Lengkap
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-full text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Wajib Diunggah
                </span>
              )}
            </div>

            {stockExcelFile ? (
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="font-medium text-slate-800 truncate">{stockExcelFile.originalFilename}</div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Ukuran: {formatFileSize(stockExcelFile.size)}</span>
                  <span>{formatDateTime(stockExcelFile.uploadedAt)}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 border border-dashed border-slate-300 rounded-lg text-center text-xs text-slate-400 bg-white">
                File spreadsheet belum diunggah.
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-200">
            {stockExcelFile && (
              <>
                <a
                  href={`/api/files/${stockExcelFile.id}/download`}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh
                </a>
                {isEditable && (
                  <button
                    onClick={() => handleDelete(stockExcelFile.id)}
                    disabled={isPending}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    title="Hapus file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
            {isEditable && !stockExcelFile && (
              <button
                onClick={() => setUploadCategory(FileCategory.STOCK_EXCEL)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                Unggah Excel
              </button>
            )}
          </div>
        </div>

        {/* 2. Recap Photo Card */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-800">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Recap Photo</h3>
                  <p className="text-[11px] text-slate-500">Foto fisik lembar rekapitulasi harian</p>
                </div>
              </div>
              {recapPhotoFile ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Lengkap
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-full text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Wajib Diunggah
                </span>
              )}
            </div>

            {recapPhotoFile ? (
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="font-medium text-slate-800 truncate">{recapPhotoFile.originalFilename}</div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Ukuran: {formatFileSize(recapPhotoFile.size)}</span>
                  <span>{formatDateTime(recapPhotoFile.uploadedAt)}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 border border-dashed border-slate-300 rounded-lg text-center text-xs text-slate-400 bg-white">
                Foto rekapitulasi belum diunggah.
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-200">
            {recapPhotoFile && (
              <>
                <a
                  href={`/api/files/${recapPhotoFile.id}/download`}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh
                </a>
                {isEditable && (
                  <button
                    onClick={() => handleDelete(recapPhotoFile.id)}
                    disabled={isPending}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    title="Hapus file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
            {isEditable && !recapPhotoFile && (
              <button
                onClick={() => setUploadCategory(FileCategory.RECAP_PHOTO)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                Unggah Foto Rekap
              </button>
            )}
          </div>
        </div>
      </div>

      <UploadModal
        closingId={closing.id}
        isOpen={Boolean(uploadCategory)}
        onClose={() => setUploadCategory(null)}
        defaultCategory={uploadCategory || FileCategory.STOCK_EXCEL}
      />
    </div>
  );
}
