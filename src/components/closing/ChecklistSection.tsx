"use client";

import { updateStockStatusAction } from "@/actions/closing";
import { deleteFileAction } from "@/actions/file";
import { ImagePreviewModal } from "@/components/ui/ImagePreviewModal";
import { AuthUser } from "@/lib/permissions";
import { formatFileSize } from "@/lib/utils";
import { GRAMMASI_LIST } from "@/modules/checklist/checklist.validation";
import { ClosingWithRelations } from "@/modules/closing/closing.types";
import { ClosingStatus, FileCategory, Role, StockStatus } from "@prisma/client";
import { AlertCircle, CheckCircle2, Download, Trash2, Upload, ZoomIn } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { UploadModal } from "./UploadModal";

interface ChecklistSectionProps {
  closing: ClosingWithRelations;
  currentUser: AuthUser;
}

export function ChecklistSection({ closing, currentUser }: ChecklistSectionProps) {
  const [selectedGramasi, setSelectedGramasi] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
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

  const handleSetStatus = (gramasi: string, targetStatus: StockStatus) => {
    if (!isEditable) return;

    startTransition(async () => {
      try {
        const res = await updateStockStatusAction(closing.id, gramasi, targetStatus);
        if (res?.error) {
          toast.error(res.error);
        } else {
          toast.success(`Status ${gramasi} diperbarui ke ${targetStatus === StockStatus.HAS_STOCK ? "HAS STOCK" : "NO STOCK"}`);
        }
      } catch (err: any) {
        toast.error(err.message || "Gagal memperbarui status stok.");
      }
    });
  };

  const handleDeleteFile = (fileId: string, gramasi: string) => {
    toast("Hapus foto stok?", {
      description: `Apakah Anda yakin ingin menghapus foto stok gramasi ${gramasi}?`,
      action: {
        label: "Hapus",
        onClick: () => {
          startTransition(async () => {
            try {
              const res = await deleteFileAction(fileId, closing.id);
              if (res?.error) {
                toast.error(res.error);
              } else {
                toast.success(`Foto stok ${gramasi} berhasil dihapus.`);
              }
            } catch (err: any) {
              toast.error(err.message || "Gagal menghapus file.");
            }
          });
        },
      },
      cancel: {
        label: "Batal",
        onClick: () => { },
      },
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
              <th className="py-2.5 px-3">Dokumentasi Foto & Preview</th>
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
                          onClick={() => handleSetStatus(gramasi, StockStatus.HAS_STOCK)}
                          disabled={isPending}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${stockStatus === StockStatus.HAS_STOCK
                            ? "bg-amber-500 text-slate-900 shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                          HAS STOCK
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetStatus(gramasi, StockStatus.NO_STOCK)}
                          disabled={isPending}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${stockStatus === StockStatus.NO_STOCK
                            ? "bg-slate-700 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                          NO STOCK
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${stockStatus === StockStatus.HAS_STOCK
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
                      <div className="flex items-center gap-3">
                        {/* Thumbnail Image with Hover Zoom Preview */}
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewData({
                              isOpen: true,
                              imageUrl: `/api/files/${photo.id}/download?inline=true`,
                              title: `Foto Stok Gramasi ${gramasi}`,
                              subtitle: `${photo.originalFilename} • ${formatFileSize(photo.size)}`,
                              downloadUrl: `/api/files/${photo.id}/download`,
                            })
                          }
                          className="group relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 hover:border-amber-400 transition-all cursor-pointer shadow-2xs"
                          title="Klik untuk melihat preview ukuran penuh"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/files/${photo.id}/download?inline=true`}
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
                            onClick={() =>
                              setPreviewData({
                                isOpen: true,
                                imageUrl: `/api/files/${photo.id}/download?inline=true`,
                                title: `Foto Stok Gramasi ${gramasi}`,
                                subtitle: `${photo.originalFilename} • ${formatFileSize(photo.size)}`,
                                downloadUrl: `/api/files/${photo.id}/download`,
                              })
                            }
                            className="text-left font-medium text-slate-800 hover:text-amber-700 truncate max-w-[140px] sm:max-w-[180px] block cursor-pointer transition-colors"
                            title={photo.originalFilename}
                          >
                            {photo.originalFilename}
                          </button>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-400">
                              {formatFileSize(photo.size)}
                            </span>
                            <a
                              href={`/api/files/${photo.id}/download`}
                              className="text-[11px] font-medium text-amber-600 hover:underline inline-flex items-center gap-0.5"
                              title="Unduh file foto"
                            >
                              <Download className="w-3 h-3" /> Unduh
                            </a>
                            {isEditable && (
                              <button
                                onClick={() => handleDeleteFile(photo.id, gramasi)}
                                disabled={isPending}
                                className="text-[11px] font-medium text-red-500 hover:underline inline-flex items-center gap-0.5 cursor-pointer ml-1"
                                title="Hapus foto"
                              >
                                <Trash2 className="w-3 h-3" /> Hapus
                              </button>
                            )}
                          </div>
                        </div>
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
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
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

      {/* Upload Modal */}
      <UploadModal
        closingId={closing.id}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        defaultCategory={FileCategory.STOCK_PHOTO}
        defaultGramasi={selectedGramasi}
      />

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
