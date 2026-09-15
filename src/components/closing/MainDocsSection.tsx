"use client";

import React, { useState, useTransition } from "react";
import { AuthUser } from "@/lib/permissions";
import { ClosingWithRelations } from "@/modules/closing/closing.types";
import { FileCategory, Role, ClosingStatus } from "@prisma/client";
import { deleteFileAction } from "@/actions/file";
import { UploadModal } from "./UploadModal";
import { ImagePreviewModal } from "@/components/ui/ImagePreviewModal";
import { FileSpreadsheet, Image as ImageIcon, Download, Trash2, Upload, CheckCircle2, AlertCircle, ZoomIn, Eye } from "lucide-react";
import { formatFileSize, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

interface MainDocsSectionProps {
  closing: ClosingWithRelations;
  currentUser: AuthUser;
}

export function MainDocsSection({ closing, currentUser }: MainDocsSectionProps) {
  const [uploadCategory, setUploadCategory] = useState<FileCategory | null>(null);
  const [isPending, startTransition] = useTransition();

  // Preview Modal state
  const [previewData, setPreviewData] = useState<{
    isOpen: boolean;
    imageUrl: string | null;
    title: string;
    subtitle?: string;
    downloadUrl?: string;
  }>({
    isOpen: false,
    imageUrl: null,
    title: "",
  });

  const isEditable =
    currentUser.role === Role.STAFF_CABANG &&
    (closing.status === ClosingStatus.DRAFT || closing.status === ClosingStatus.REVISION_REQUIRED);

  const stockExcelFile = closing.files.find((f) => f.category === FileCategory.STOCK_EXCEL);
  const recapPhotoFile = closing.files.find((f) => f.category === FileCategory.RECAP_PHOTO);

  const handleDelete = (fileId: string, filename: string) => {
    toast("Hapus file dokumen?", {
      description: `Apakah Anda yakin ingin menghapus ${filename}?`,
      action: {
        label: "Hapus",
        onClick: () => {
          startTransition(async () => {
            try {
              const res = await deleteFileAction(fileId, closing.id);
              if (res?.error) {
                toast.error(res.error);
              } else {
                toast.success(`${filename} berhasil dihapus.`);
              }
            } catch (err: any) {
              toast.error(err.message || "Gagal menghapus file.");
            }
          });
        },
      },
      cancel: {
        label: "Batal",
        onClick: () => {},
      },
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6 mb-6">
      <div className="pb-3 border-b border-slate-100 mb-4">
        <h2 className="text-base font-bold text-slate-900">
          Dokumentasi Utama Closing (Excel & Rekap)
        </h2>
        <p className="text-xs text-slate-500">
          Dua dokumen wajib closing: File Excel rekapitulasi stok dan Foto fisik lembar rekapitulasi harian.
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
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1 shadow-2xs">
                <div className="font-semibold text-slate-800 truncate">{stockExcelFile.originalFilename}</div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Ukuran: {formatFileSize(stockExcelFile.size)}</span>
                  <span>{formatDateTime(stockExcelFile.uploadedAt)}</span>
                </div>
              </div>
            ) : (
              <div className="p-5 border border-dashed border-slate-300 rounded-lg text-center text-xs text-slate-400 bg-white">
                File Excel belum diunggah.
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-200">
            {stockExcelFile && (
              <>
                <a
                  href={`/api/files/${stockExcelFile.id}/download`}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh
                </a>
                {isEditable && (
                  <button
                    onClick={() => handleDelete(stockExcelFile.id, stockExcelFile.originalFilename)}
                    disabled={isPending}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
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
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Unggah Excel
              </button>
            )}
          </div>
        </div>

        {/* 2. Recap Photo Card with Image Thumbnail Preview */}
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
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex items-center gap-3">
                {/* Visual Thumbnail with Hover Effect */}
                <button
                  type="button"
                  onClick={() =>
                    setPreviewData({
                      isOpen: true,
                      imageUrl: `/api/files/${recapPhotoFile.id}/download?inline=true`,
                      title: "Foto Rekapitulasi Closing",
                      subtitle: `${recapPhotoFile.originalFilename} • ${formatFileSize(recapPhotoFile.size)}`,
                      downloadUrl: `/api/files/${recapPhotoFile.id}/download`,
                    })
                  }
                  className="group relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 hover:border-blue-400 transition-all cursor-pointer shadow-2xs"
                  title="Klik untuk melihat preview ukuran penuh"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/files/${recapPhotoFile.id}/download?inline=true`}
                    alt="Foto rekapitulasi"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/35 transition-colors flex items-center justify-center">
                    <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                  </div>
                </button>

                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewData({
                        isOpen: true,
                        imageUrl: `/api/files/${recapPhotoFile.id}/download?inline=true`,
                        title: "Foto Rekapitulasi Closing",
                        subtitle: `${recapPhotoFile.originalFilename} • ${formatFileSize(recapPhotoFile.size)}`,
                        downloadUrl: `/api/files/${recapPhotoFile.id}/download`,
                      })
                    }
                    className="font-semibold text-slate-800 hover:text-blue-600 truncate block text-xs cursor-pointer text-left transition-colors"
                  >
                    {recapPhotoFile.originalFilename}
                  </button>
                  <div className="text-[11px] text-slate-400 mt-0.5 space-y-0.5">
                    <div>Ukuran: {formatFileSize(recapPhotoFile.size)}</div>
                    <div>{formatDateTime(recapPhotoFile.uploadedAt)}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 border border-dashed border-slate-300 rounded-lg text-center text-xs text-slate-400 bg-white">
                Foto rekapitulasi belum diunggah.
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-200">
            {recapPhotoFile && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setPreviewData({
                      isOpen: true,
                      imageUrl: `/api/files/${recapPhotoFile.id}/download?inline=true`,
                      title: "Foto Rekapitulasi Closing",
                      subtitle: `${recapPhotoFile.originalFilename} • ${formatFileSize(recapPhotoFile.size)}`,
                      downloadUrl: `/api/files/${recapPhotoFile.id}/download`,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Lihat Preview
                </button>
                <a
                  href={`/api/files/${recapPhotoFile.id}/download`}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh
                </a>
                {isEditable && (
                  <button
                    onClick={() => handleDelete(recapPhotoFile.id, recapPhotoFile.originalFilename)}
                    disabled={isPending}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
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
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Unggah Foto Rekap
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {uploadCategory && (
        <UploadModal
          closingId={closing.id}
          isOpen={true}
          onClose={() => setUploadCategory(null)}
          defaultCategory={uploadCategory}
        />
      )}

      {/* Image Preview Lightbox Modal */}
      <ImagePreviewModal
        isOpen={previewData.isOpen}
        onClose={() => setPreviewData((prev) => ({ ...prev, isOpen: false }))}
        imageUrl={previewData.imageUrl}
        title={previewData.title}
        subtitle={previewData.subtitle}
        downloadUrl={previewData.downloadUrl}
      />
    </div>
  );
}
