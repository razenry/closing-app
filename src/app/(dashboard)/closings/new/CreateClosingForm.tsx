"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClosingAction } from "@/actions/closing";
import { AuthUser } from "@/lib/permissions";
import { AlertCircle, Calendar, Building2, PlusCircle } from "lucide-react";

interface CreateClosingFormProps {
  user: AuthUser;
  branches: any[];
}

export function CreateClosingForm({ user, branches }: CreateClosingFormProps) {
  const router = useRouter();
  const [branchId, setBranchId] = useState(user.branchId || branches[0]?.id || "");
  const [closingDate, setClosingDate] = useState("2026-09-15");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("branchId", branchId);
    formData.append("closingDate", closingDate);
    if (notes) formData.append("notes", notes);

    startTransition(async () => {
      const res = await createClosingAction(formData);
      if (res?.error) {
        setError(res.error);
      } else if (res?.closingId) {
        router.push(`/closings/${res.closingId}`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block font-semibold text-slate-700 mb-1">
          Cabang
        </label>
        <div className="relative">
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            disabled={Boolean(user.branchId)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white text-xs disabled:bg-slate-100"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
          <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      <div>
        <label className="block font-semibold text-slate-700 mb-1">
          Tanggal Closing
        </label>
        <div className="relative">
          <input
            type="date"
            value={closingDate}
            onChange={(e) => setClosingDate(e.target.value)}
            required
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
          <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
        <span className="text-[11px] text-slate-400 mt-1 block">
          Catatan: Satu cabang hanya dapat memiliki satu closing per tanggal (BR-001).
        </span>
      </div>

      <div>
        <label className="block font-semibold text-slate-700 mb-1">
          Catatan Awal (Opsional)
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tuliskan catatan tambahan mengenai kondisi stok hari ini jika ada..."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 font-bold text-slate-900 shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isPending ? "Memproses..." : "Buat & Mulai Checklist Closing"}</span>
        </button>
      </div>
    </form>
  );
}
