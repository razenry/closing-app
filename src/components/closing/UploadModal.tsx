"use client";

import React, { useState, useTransition, useEffect } from "react";
import { uploadFileAction } from "@/actions/file";
import { FileCategory } from "@prisma/client";
import { Upload, X, AlertCircle, FileText, Image as ImageIcon, FileSpreadsheet, Loader2, Sparkles } from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import { toast } from "sonner";

interface UploadModalProps {
  closingId: string;
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: FileCategory;
  defaultGramasi?: string | null;
  lockCategory?: boolean;
  lockGramasi?: boolean;
}

export function UploadModal({
  closingId,
  isOpen,
  onClose,
  defaultCategory = FileCategory.STOCK_PHOTO,
  defaultGramasi = null,
  lockCategory = false,
  lockGramasi = false,
}: UploadModalProps) {
  const [category, setCategory] = useState<FileCategory>(defaultCategory);
  const [gramasi, setGramasi] = useState<string>(defaultGramasi || "10g");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setCategory(defaultCategory);
    if (defaultGramasi) setGramasi(defaultGramasi);
  }, [defaultCategory, defaultGramasi, isOpen]);

  useEffect(() => {
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 10 * 1024 * 1024) {
        setError("Ukuran file melebihi batas maksimal 10MB.");
        return;
      }
      setError(null);
      setFile(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Silakan pilih file yang akan diunggah.");
      return;
    }

    const formData = new FormData();
    formData.append("closingId", closingId);
    formData.append("category", category);
    if (category === FileCategory.STOCK_PHOTO) {
      formData.append("gramasi", gramasi);
    }
    formData.append("file", file);

    startTransition(async () => {
      try {
        const res = await uploadFileAction(formData);
        if (res?.error) {
          setError(res.error);
          toast.error(res.error);
        } else {
          toast.success(
            category === FileCategory.STOCK_PHOTO
              ? `Foto stok ${gramasi} berhasil diunggah ke cloud!`
              : category === FileCategory.STOCK_EXCEL
              ? `File Excel ${file.name} berhasil diunggah!`
              : `Foto Rekap ${file.name} berhasil diunggah!`
          );
          setFile(null);
          setPreviewUrl(null);
          onClose();
        }
      } catch (err: any) {
        const msg = err.message || "Gagal mengunggah file.";
        setError(msg);
        toast.error(msg);
      }
    });
  };

  // Compute adaptive title & subtitle
  let modalTitle = "Unggah Dokumen Closing";
  let modalSubtitle = "Pilih kategori dan lampirkan dokumen";

  if (category === FileCategory.STOCK_PHOTO && lockGramasi) {
    modalTitle = `Unggah Foto Stok Gramasi ${gramasi}`;
    modalSubtitle = `Foto fisik emas gramasi ${gramasi} untuk verifikasi stok`;
  } else if (category === FileCategory.STOCK_EXCEL) {
    modalTitle = "Unggah File Excel Stok";
    modalSubtitle = "File spreadsheet rekapitulasi harian (.xlsx, .xls)";
  } else if (category === FileCategory.RECAP_PHOTO) {
    modalTitle = "Unggah Foto Rekapitulasi";
    modalSubtitle = "Foto fisik lembar rekapitulasi closing harian";
  }

  const isImageCategory =
    category === FileCategory.STOCK_PHOTO || category === FileCategory.RECAP_PHOTO;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${
              category === FileCategory.STOCK_EXCEL
                ? "bg-emerald-100 text-emerald-800"
                : category === FileCategory.RECAP_PHOTO
                ? "bg-blue-100 text-blue-800"
                : "bg-amber-100 text-amber-800"
            }`}>
              {category === FileCategory.STOCK_EXCEL ? (
                <FileSpreadsheet className="w-5 h-5" />
              ) : (
                <ImageIcon className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {modalTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{modalSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Target Item Badge when locked */}
          {lockCategory ? (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Target Dokumen
                </span>
                <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                  {category === FileCategory.STOCK_PHOTO
                    ? `Foto Stok Gramasi: ${gramasi}`
                    : category === FileCategory.STOCK_EXCEL
                    ? "File Spreadsheet Rekap Stok"
                    : "Foto Lembar Rekapitulasi"}
                </span>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                category === FileCategory.STOCK_EXCEL
                  ? "bg-emerald-100 text-emerald-800"
                  : category === FileCategory.RECAP_PHOTO
                  ? "bg-blue-100 text-blue-800"
                  : "bg-amber-100 text-amber-800"
              }`}>
                {category === FileCategory.STOCK_PHOTO
                  ? gramasi
                  : category === FileCategory.STOCK_EXCEL
                  ? ".XLSX / .XLS"
                  : "FOTO REKAP"}
              </span>
            </div>
          ) : (
            <>
              {/* Category selector when not locked */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kategori Dokumen
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FileCategory)}
                  disabled={isPending}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  <option value={FileCategory.STOCK_PHOTO}>Foto Fisik Stok (Gramasi)</option>
                  <option value={FileCategory.STOCK_EXCEL}>File Excel Stok (Spreadsheet)</option>
                  <option value={FileCategory.RECAP_PHOTO}>Foto Rekap Closing</option>
                </select>
              </div>

              {category === FileCategory.STOCK_PHOTO && !lockGramasi && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pilih Gramasi Emas
                  </label>
                  <select
                    value={gramasi}
                    onChange={(e) => setGramasi(e.target.value)}
                    disabled={isPending}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    {["0.5g", "1g", "2g", "3g", "5g", "10g", "25g", "50g", "100g"].map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* File Picker with Realtime Live Preview */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {isImageCategory
                ? "Pilih File Gambar (JPG, PNG, WebP — Maks 10MB)"
                : "Pilih File Spreadsheet (XLSX, XLS — Maks 10MB)"}
            </label>
            <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-amber-50/20 transition-all">
              {previewUrl ? (
                <div className="flex flex-col items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview unggahan"
                    className="w-28 h-28 object-cover rounded-xl border border-slate-300 shadow-md"
                  />
                  <div className="text-center">
                    <span className="text-[11px] font-semibold text-slate-800 truncate max-w-[220px] block">
                      {file?.name}
                    </span>
                    <span className="text-[10px] text-amber-600 font-medium">
                      Klik untuk mengganti gambar
                    </span>
                  </div>
                </div>
              ) : file ? (
                <div className="flex items-center gap-3 text-slate-700 p-2">
                  {category === FileCategory.STOCK_EXCEL ? (
                    <FileSpreadsheet className="w-8 h-8 text-emerald-600 shrink-0" />
                  ) : (
                    <FileText className="w-8 h-8 text-amber-600 shrink-0" />
                  )}
                  <div className="text-left">
                    <p className="font-semibold truncate max-w-[200px] text-xs">{file.name}</p>
                    <p className="text-[11px] text-slate-400">{formatFileSize(file.size)}</p>
                    <span className="text-[10px] text-amber-600 font-medium mt-0.5 block">
                      Klik untuk mengganti file
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                  <p className="font-semibold text-slate-700 text-xs">
                    Klik untuk memilih {isImageCategory ? "foto" : "file excel"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isImageCategory
                      ? "Format: JPG, JPEG, PNG, WebP"
                      : "Format: .xlsx, .xls"}
                  </p>
                </div>
              )}
              <input
                type="file"
                className="hidden"
                disabled={isPending}
                accept={
                  isImageCategory
                    ? "image/jpeg,image/png,image/webp"
                    : ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                }
                onChange={handleFileChange}
              />
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || !file}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-900 font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isPending ? "Mengunggah..." : "Unggah Dokumen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
