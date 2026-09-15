"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestRevisionAction } from "@/actions/closing";
import { triggerRealtimeAction } from "@/components/providers/RealtimeProvider";
import { AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";

interface RevisionModalProps {
  closingId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RevisionModal({ closingId, isOpen, onClose }: RevisionModalProps) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!note.trim() || note.trim().length < 3) {
      setError("Catatan revisi wajib diisi (minimal 3 karakter).");
      return;
    }

    startTransition(async () => {
      const res = await requestRevisionAction(closingId, note);
      if (res?.error) {
        setError(res.error);
        toast.error(res.error);
      } else {
        toast.success("Permintaan revisi berhasil dikirim ke staf cabang!");
        setNote("");
        triggerRealtimeAction();
        router.refresh();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Minta Revisi Dokumentasi Closing
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Catatan Revisi untuk Cabang <span className="text-red-500">*</span>
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Jelaskan dokumen atau gramasi apa yang perlu diperbaiki atau diunggah ulang oleh Staff Cabang.
            </p>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Foto stok 10g kurang jelas. Silakan upload ulang foto stok 10g dengan pencahayaan yang cukup."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              required
            />
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
              disabled={isPending || !note.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg shadow-xs"
            >
              {isPending ? "Mengirim..." : "Kirim Permintaan Revisi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
