"use client";

import React, { useState, useTransition } from "react";
import { AuthUser } from "@/lib/permissions";
import { ClosingWithRelations } from "@/modules/closing/closing.types";
import { GRAMMASI_LIST } from "@/modules/checklist/checklist.validation";
import { StockStatus, FileCategory, Role, ClosingStatus } from "@prisma/client";
import { updateStockStatusAction } from "@/actions/closing";
import { deleteFileAction } from "@/actions/file";
import { UploadModal } from "./UploadModal";
import { CheckCircle2, AlertCircle, Image as ImageIcon, Download, Trash2, Upload, ExternalLink } from "lucide-react";
import { formatFileSize } from "@/lib/utils";

interface ChecklistSectionProps {
  closing: ClosingWithRelations;
  currentUser: AuthUser;
}

export function ChecklistSection({ closing, currentUser }: ChecklistSectionProps) {
  const [selectedGramasi, setSelectedGramasi] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isEditable =
    currentUser.role === Role.STAFF_CABANG &&
    (closing.status === ClosingStatus.DRAFT || closing.status === ClosingStatus.REVISION_REQUIRED);

  const handleToggleStatus = (gramasi: string, currentStatus: StockStatus) => {
    if (!isEditable) return;
    const nextStatus =
      currentStatus === StockStatus.HAS_STOCK ? StockStatus.NO_STOCK : StockStatus.HAS_STOCK;

    startTransition(async () => {
      await updateStockStatusAction(closing.id, gramasi, nextStatus);
    });
  };

  const handleDeleteFile = (fileId: string) => {
    if (!confirm("Hapus file foto stok ini?")) return;
    startTransition(async () => {
      await deleteFileAction(fileId, closing.id);
    });
  };

  const handleOpenUpload = (gramasi: string) => {
    setSelectedGramasi(gramasi);
    setIsUploadOpen(true);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6 mb-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Checklist Stok Gramasi Fisik (9 Item)
          </h2>
          <p className="text-xs text-slate-500">
            Pilih status stok untuk masing-masing gramasi. Aturan: <strong>HAS_STOCK</strong> wajib melampirkan foto, <strong>NO_STOCK</strong> otomatis lengkap tanpa foto.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] bg-slate-50">
              <th className="py-2.5 px-3">Gramasi</th>
              <th className="py-2.5 px-3">Deklarasi Stok</th>
              <th className="py-2.5 px-3">Dokumentasi Foto</th>
              <th className="py-2.5 px-3 text-center">Status Kelengkapan</th>
              {isEditable && <th className="py-2.5 px-3 text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {GRAMMASI_LIST.map((gramasi) => {
              const checklist = closing.checklists.find((c) => c.gramasi === gramasi);
              const stockStatus = checklist?.stockStatus ?? StockStatus.NOT_SET;
              const photo = closing.files.find(
                (f) => f.category === FileCategory.STOCK_PHOTO && f.gramasi === gramasi
              );

              // Completion determination
              let isComplete = false;
              if (stockStatus === StockStatus.NO_STOCK) {
                isComplete = true;
              } else if (stockStatus === StockStatus.HAS_STOCK && photo) {
                isComplete = true;
              }

              return (
                <tr key={gramasi} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900 text-sm">
                    {gramasi}
                  </td>

                  <td className="py-3 px-3">
                    {isEditable ? (
                      <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(gramasi, StockStatus.NO_STOCK)}
                          disabled={isPending}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                            stockStatus === StockStatus.HAS_STOCK
                              ? "bg-amber-500 text-slate-900 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          HAS STOCK
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(gramasi, StockStatus.HAS_STOCK)}
                          disabled={isPending}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                            stockStatus === StockStatus.NO_STOCK
                              ? "bg-slate-700 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          NO STOCK
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${
                          stockStatus === StockStatus.HAS_STOCK
                            ? "bg-amber-100 text-amber-800"
                            : stockStatus === StockStatus.NO_STOCK
                            ? "bg-slate-200 text-slate-700"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {stockStatus === StockStatus.HAS_STOCK
                          ? "HAS STOCK"
                          : stockStatus === StockStatus.NO_STOCK
                          ? "NO STOCK"
                          : "BELUM DIATUR"}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    {photo ? (
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="truncate max-w-[160px] text-slate-700 font-medium">
                          {photo.originalFilename}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ({formatFileSize(photo.size)})
                        </span>
                        <a
                          href={`/api/files/${photo.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-slate-400 hover:text-slate-700"
                          title="Unduh file"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        {isEditable && (
                          <button
                            onClick={() => handleDeleteFile(photo.id)}
                            disabled={isPending}
                            className="p-1 text-slate-400 hover:text-red-600"
                            title="Hapus foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : stockStatus === StockStatus.NO_STOCK ? (
                      <span className="text-slate-400 italic">
                        Tanpa stok — foto tidak wajib
                      </span>
                    ) : stockStatus === StockStatus.HAS_STOCK ? (
                      <span className="text-amber-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Foto wajib diunggah
                      </span>
                    ) : (
                      <span className="text-slate-400">Pilih status stok</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {isComplete ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Lengkap
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full text-[11px]">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Belum Lengkap
                      </span>
                    )}
                  </td>

                  {isEditable && (
                    <td className="py-3 px-3 text-right">
                      {stockStatus === StockStatus.HAS_STOCK && !photo && (
                        <button
                          type="button"
                          onClick={() => handleOpenUpload(gramasi)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold text-xs transition-colors cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          Unggah
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <UploadModal
        closingId={closing.id}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        defaultCategory={FileCategory.STOCK_PHOTO}
        defaultGramasi={selectedGramasi}
      />
    </div>
  );
}
