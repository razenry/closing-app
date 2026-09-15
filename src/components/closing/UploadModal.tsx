"use client";

import React, { useState, useTransition, useEffect } from "react";
import { uploadFileAction } from "@/actions/file";
import { FileCategory } from "@prisma/client";
import { Upload, X, AlertCircle, FileText, CheckCircle2, Image as ImageIcon, Loader2 } from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import { toast } from "sonner";

interface UploadModalProps {
  closingId: string;
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: FileCategory;
  defaultGramasi?: string | null;
}

export function UploadModal({
  closingId,
  isOpen,
  onClose,
  defaultCategory = FileCategory.STOCK_PHOTO,
  defaultGramasi = null,
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
              : `Dokumen ${file.name} berhasil diunggah ke cloud!`
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Upload className="w-4 h-4 text-amber-600" />
            Unggah Dokumen Closing
          </h3>
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

          {category === FileCategory.STOCK_PHOTO && (
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

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Pilih File (JPG, PNG, PDF, XLSX - Maks 10MB)
            </label>
            <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-amber-50/20 transition-all">
              {previewUrl ? (
                <div className="flex flex-col items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview unggahan"
                    className="w-24 h-24 object-cover rounded-lg border border-slate-300 shadow-xs"
                  />
                  <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[200px]">
                    {file?.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Klik untuk mengganti foto
                  </span>
                </div>
              ) : file ? (
                <div className="flex items-center gap-2 text-slate-700">
                  <FileText className="w-6 h-6 text-amber-600" />
                  <div className="text-left">
                    <p className="font-semibold truncate max-w-[200px]">{file.name}</p>
                    <p className="text-[11px] text-slate-400">{formatFileSize(file.size)}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                  <p className="font-semibold text-slate-700">Klik untuk memilih file</p>
                  <p className="text-[11px] text-slate-400">atau tarik dan letakkan file di sini</p>
                </div>
              )}
              <input
                type="file"
                className="hidden"
                disabled={isPending}
                accept={
                  category === FileCategory.STOCK_PHOTO || category === FileCategory.RECAP_PHOTO
                    ? "image/jpeg,image/png,image/webp"
                    : ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                }
                onChange={handleFileChange}
              />
            </label>
          </div>

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
              {isPending ? "Mengunggah..." : "Unggah File"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
