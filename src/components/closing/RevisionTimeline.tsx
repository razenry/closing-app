import React from "react";
import { formatDateTime } from "@/lib/utils";
import { History, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface RevisionTimelineProps {
  revisions: any[];
}

export function RevisionTimeline({ revisions }: RevisionTimelineProps) {
  if (revisions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6 mb-6">
        <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
          <History className="w-4 h-4 text-amber-600" />
          Riwayat Revisi (BR-008)
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Catatan permintaan revisi dari Kantor Pusat dan riwayat penyelesaiannya.
        </p>
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-400 italic text-center">
          Tidak ada riwayat revisi pada closing ini.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6 mb-6">
      <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
        <History className="w-4 h-4 text-amber-600" />
        Riwayat Revisi (BR-008)
      </h2>
      <p className="text-xs text-slate-500 mb-4">
        Catatan permanen permintaan revisi dari Kantor Pusat dan riwayat penyelesaiannya.
      </p>

      <div className="space-y-4">
        {revisions.map((rev) => (
          <div
            key={rev.id}
            className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 text-xs relative"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-amber-900 px-2 py-0.5 rounded bg-amber-200 text-xs">
                Revisi #{rev.revisionNumber}
              </span>
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDateTime(rev.requestedAt || rev.createdAt)}
              </span>
            </div>

            <div className="mb-3">
              <div className="text-slate-500 text-[11px]">Diminta oleh:</div>
              <div className="font-semibold text-slate-800">{rev.requestedBy?.name || "Staff Pusat"}</div>
              <div className="mt-2 p-2.5 rounded-lg bg-white border border-amber-200 text-slate-700 italic">
                &ldquo;{rev.note}&rdquo;
              </div>
            </div>

            {rev.resolvedAt ? (
              <div className="mt-2 pt-2 border-t border-amber-200 flex items-center justify-between text-emerald-800 font-medium text-[11px]">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Diperbaiki oleh: {rev.resolvedBy?.name || "Staff Cabang"}
                </span>
                <span className="text-slate-400">{formatDateTime(rev.resolvedAt)}</span>
              </div>
            ) : (
              <div className="mt-2 pt-2 border-t border-amber-200 flex items-center gap-1 text-amber-700 font-medium text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Menunggu perbaikan dokumen oleh Staff Cabang</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
