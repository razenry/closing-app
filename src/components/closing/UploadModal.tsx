"use client";

import React, { useState, useTransition } from "react";
import { uploadFileAction } from "@/actions/file";
import { FileCategory } from "@prisma/client";
import { Upload, X, AlertCircle, FileText, CheckCircle2 } from "lucide-react";

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
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

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
      const res = await uploadFileAction(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setFile(null);
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Upload className="w-4 h-4 text-amber-600" />
            Unggah Dokumen Closing
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
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
              File Dokumen (JPG, PNG, PDF, XLSX, XLS - Maks 10MB)
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:bg-slate-50 transition-colors">
              <input
                type="file"
                id="file-upload"
                accept=".jpg,.jpeg,.png,.pdf,.xls,.xlsx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
              >
                <FileText className="w-8 h-8 text-amber-500" />
                <span className="font-medium text-slate-700">
                  {file ? file.name : "Klik untuk memilih file"}
                </span>
                <span className="text-[11px] text-slate-400">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : "Drag & drop file di sini"}
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || !file}
              className="px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-lg shadow-xs flex items-center gap-1.5"
            >
              {isPending ? "Mengunggah..." : "Unggah File"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
