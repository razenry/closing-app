"use client";

import React, { useState, useTransition } from "react";
import { X, Building2, AlertCircle } from "lucide-react";
import { createBranchAction, updateBranchAction } from "@/actions/admin";
import { toast } from "sonner";

interface BranchData {
  id: string;
  name: string;
  code: string;
  active: boolean;
}

interface BranchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchToEdit?: BranchData | null;
}

export function BranchFormModal({
  isOpen,
  onClose,
  branchToEdit,
}: BranchFormModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isEditing = !!branchToEdit;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = isEditing
          ? await updateBranchAction(branchToEdit.id, formData)
          : await createBranchAction(formData);

        if (res?.error) {
          setError(res.error);
          toast.error(res.error);
        } else {
          toast.success(
            isEditing
              ? `Cabang ${formData.get("name")} berhasil diperbarui!`
              : `Cabang ${formData.get("name")} berhasil ditambahkan!`
          );
          onClose();
        }
      } catch (err: any) {
        const msg = err.message || "Terjadi kesalahan.";
        setError(msg);
        toast.error(msg);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {isEditing ? "Edit Data Cabang" : "Tambah Cabang Baru"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEditing
                  ? "Perbarui informasi nama atau kode cabang"
                  : "Daftarkan cabang logistik Logam Mulia baru"}
              </p>
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
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Cabang <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={branchToEdit?.name || ""}
              placeholder="Contoh: Cabang Surabaya"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Kode Cabang (Unik) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="code"
              required
              defaultValue={branchToEdit?.code || ""}
              placeholder="Contoh: SBY"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs uppercase font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Kode cabang digunakan sebagai identitas dokumen dan nama file ZIP.
            </p>
          </div>

          {isEditing && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Status Operasional
              </label>
              <select
                name="active"
                defaultValue={branchToEdit.active ? "true" : "false"}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs bg-white"
              >
                <option value="true">Aktif (Dapat membuat closing)</option>
                <option value="false">Nonaktif (Diarsipkan)</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Tambah Cabang"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
