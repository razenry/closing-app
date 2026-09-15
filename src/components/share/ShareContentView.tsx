"use client";

import React, { useState } from "react";
import { FileCategory, StockStatus } from "@prisma/client";
import { GRAMMASI_LIST } from "@/modules/checklist/checklist.validation";
import { formatFileSize, formatDateTime } from "@/lib/utils";
import { ImagePreviewModal } from "@/components/ui/ImagePreviewModal";
import {
  Image as ImageIcon,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  ZoomIn,
  Eye,
  FileArchive,
} from "lucide-react";

interface ShareContentViewProps {
  closing: any;
  token: string;
}

export function ShareContentView({ closing, token }: ShareContentViewProps) {
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

  const openPreview = (photo: any, title: string) => {
    setPreviewData({
      isOpen: true,
      imageUrl: `/api/files/${photo.id}/download?inline=true&token=${token}`,
      title,
      subtitle: `${photo.originalFilename} • ${formatFileSize(photo.size)}`,
      downloadUrl: `/api/files/${photo.id}/download?token=${token}`,
    });
  };

  const excelFile = closing.files.find(
    (f: any) => f.category === FileCategory.STOCK_EXCEL
  );
  const recapPhotoFile = closing.files.find(
    (f: any) => f.category === FileCategory.RECAP_PHOTO
  );

  return (
    <>
      {/* 1. Gramasi Checklist Overview with Previews */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Ringkasan & Foto Stok Gramasi Fisik
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dokumentasi foto fisik emas per gramasi untuk validasi stok harian.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg hidden sm:inline-block">
            9 Item Gramasi
          </span>
        </div>

        {/* Mobile Touch Cards View (sm:hidden) */}
        <div className="sm:hidden divide-y divide-slate-100">
          {GRAMMASI_LIST.map((gramasi) => {
            const item = closing.checklists.find((c: any) => c.gramasi === gramasi);
            const stockStatus = item?.stockStatus ?? StockStatus.NOT_SET;
            const photo = closing.files.find(
              (f: any) => f.category === FileCategory.STOCK_PHOTO && f.gramasi === gramasi
            );
            const isComplete =
              stockStatus === StockStatus.NO_STOCK ||
              (stockStatus === StockStatus.HAS_STOCK && photo);

            return (
              <div key={gramasi} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{gramasi}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        stockStatus === StockStatus.HAS_STOCK
                          ? "bg-amber-100 text-amber-800"
                          : stockStatus === StockStatus.NO_STOCK
                          ? "bg-slate-200 text-slate-700"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {stockStatus}
                    </span>
                  </div>

                  {isComplete ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Lengkap
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-semibold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Belum Lengkap
                    </span>
                  )}
                </div>

                {/* Photo or No-stock indicator */}
                {photo ? (
                  <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => openPreview(photo, `Foto Stok Gramasi ${gramasi}`)}
                      className="group relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 shadow-2xs"
                      title="Klik untuk melihat foto ukuran penuh"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/files/${photo.id}/download?inline=true&token=${token}`}
                        alt={`Foto stok ${gramasi}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center">
                        <ZoomIn className="w-4 h-4 text-white drop-shadow-md" />
                      </div>
                    </button>

                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => openPreview(photo, `Foto Stok Gramasi ${gramasi}`)}
                        className="text-left font-semibold text-slate-800 hover:text-amber-700 truncate text-xs block transition-colors"
                      >
                        {photo.originalFilename}
                      </button>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatFileSize(photo.size)}
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        <button
                          type="button"
                          onClick={() => openPreview(photo, `Foto Stok Gramasi ${gramasi}`)}
                          className="text-amber-600 hover:text-amber-800 font-semibold text-xs inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Lihat Preview
                        </button>
                        <a
                          href={`/api/files/${photo.id}/download?token=${token}`}
                          className="text-slate-600 hover:text-slate-800 font-medium text-xs inline-flex items-center gap-1"
                          download
                        >
                          <Download className="w-3 h-3" />
                          Unduh
                        </a>
                      </div>
                    </div>
                  </div>
                ) : stockStatus === StockStatus.NO_STOCK ? (
                  <div className="text-xs text-slate-400 italic bg-slate-50/70 p-2 rounded-lg">
                    Tanpa stok fisik (Foto tidak diperlukan)
                  </div>
                ) : (
                  <div className="text-xs text-amber-600 bg-amber-50/60 p-2 rounded-lg border border-amber-200/50">
                    Foto belum tersedia
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop Table View (hidden sm:block) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] bg-slate-50">
                <th className="py-3 px-4">Gramasi</th>
                <th className="py-3 px-4">Status Stok</th>
                <th className="py-3 px-4">Dokumentasi Foto & Preview</th>
                <th className="py-3 px-4 text-right">Kelengkapan</th>
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
                  stockStatus === StockStatus.NO_STOCK ||
                  (stockStatus === StockStatus.HAS_STOCK && photo);

                return (
                  <tr key={gramasi} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                      {gramasi}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${
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
                    <td className="py-3 px-4">
                      {photo ? (
                        <div className="flex items-center gap-3">
                          {/* Image Thumbnail with Click-to-Preview */}
                          <button
                            type="button"
                            onClick={() => openPreview(photo, `Foto Stok Gramasi ${gramasi}`)}
                            className="group relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 hover:border-amber-400 transition-all cursor-pointer shadow-2xs"
                            title="Klik untuk melihat preview ukuran penuh"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`/api/files/${photo.id}/download?inline=true&token=${token}`}
                              alt={`Foto stok ${gramasi}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/35 transition-colors flex items-center justify-center">
                              <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                            </div>
                          </button>

                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => openPreview(photo, `Foto Stok Gramasi ${gramasi}`)}
                              className="text-left font-semibold text-slate-800 hover:text-amber-700 truncate max-w-[200px] block cursor-pointer transition-colors"
                              title={photo.originalFilename}
                            >
                              {photo.originalFilename}
                            </button>
                            <div className="flex items-center gap-3 mt-1 text-[11px]">
                              <span className="text-slate-400">
                                {formatFileSize(photo.size)}
                              </span>
                              <button
                                type="button"
                                onClick={() => openPreview(photo, `Foto Stok Gramasi ${gramasi}`)}
                                className="text-amber-600 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" /> Preview
                              </button>
                              <a
                                href={`/api/files/${photo.id}/download?token=${token}`}
                                className="text-slate-600 hover:text-slate-900 hover:underline flex items-center gap-0.5"
                                download
                              >
                                <Download className="w-3 h-3" /> Unduh
                              </a>
                            </div>
                          </div>
                        </div>
                      ) : stockStatus === StockStatus.NO_STOCK ? (
                        <span className="text-slate-400 italic">
                          Tanpa stok (Foto tidak wajib)
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">
                          Foto belum tersedia
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
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

      {/* 2. Main Documentation Cards with Previews */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Excel Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">File Rekapitulasi Excel</h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                excelFile ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400"
              }`}>
                {excelFile ? "TERSEDIA" : "BELUM ADA"}
              </span>
            </div>

            {excelFile ? (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div className="font-semibold text-slate-800 truncate mb-1">
                  {excelFile.originalFilename}
                </div>
                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <div>Ukuran: {formatFileSize(excelFile.size)}</div>
                  <div>Diunggah: {formatDateTime(excelFile.createdAt)}</div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                File Excel stok belum dilampirkan oleh cabang.
              </p>
            )}
          </div>

          {excelFile && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <a
                href={`/api/files/${excelFile.id}/download?token=${token}`}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                download
              >
                <Download className="w-3.5 h-3.5" />
                Unduh File Excel
              </a>
            </div>
          )}
        </div>

        {/* Recap Photo Card with Rich Image Preview */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Foto Fisik Rekapitulasi</h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                recapPhotoFile ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-400"
              }`}>
                {recapPhotoFile ? "TERSEDIA" : "BELUM ADA"}
              </span>
            </div>

            {recapPhotoFile ? (
              <div className="space-y-3">
                {/* Natural Preview Banner with Hover Zoom Overlay */}
                <button
                  type="button"
                  onClick={() => openPreview(recapPhotoFile, "Foto Rekapitulasi Closing")}
                  className="group relative w-full h-48 rounded-xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center p-2 text-left shadow-2xs cursor-pointer"
                  title="Klik untuk memperbesar preview"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/files/${recapPhotoFile.id}/download?inline=true&token=${token}`}
                    alt="Foto rekapitulasi"
                    className="max-h-full max-w-full object-contain rounded"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/20 transition-colors flex items-end p-2.5">
                    <div className="flex items-center justify-between w-full text-white bg-slate-950/70 backdrop-blur-xs px-2.5 py-1.5 rounded-lg">
                      <div className="text-[11px] font-semibold truncate pr-2">
                        {recapPhotoFile.originalFilename}
                      </div>
                      <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shrink-0">
                        <ZoomIn className="w-3 h-3" /> Preview
                      </span>
                    </div>
                  </div>
                </button>

                <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                  <span>Ukuran: {formatFileSize(recapPhotoFile.size)}</span>
                  <span>Diunggah: {formatDateTime(recapPhotoFile.createdAt)}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Foto fisik lembar rekapitulasi belum dilampirkan.
              </p>
            )}
          </div>

          {recapPhotoFile && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => openPreview(recapPhotoFile, "Foto Rekapitulasi Closing")}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                Lihat Preview
              </button>
              <a
                href={`/api/files/${recapPhotoFile.id}/download?token=${token}`}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                download
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Foto
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Image Preview Modal */}
      <ImagePreviewModal
        isOpen={previewData.isOpen}
        onClose={() => setPreviewData((prev) => ({ ...prev, isOpen: false }))}
        imageUrl={previewData.imageUrl}
        title={previewData.title}
        subtitle={previewData.subtitle}
        downloadUrl={previewData.downloadUrl}
      />
    </>
  );
}
