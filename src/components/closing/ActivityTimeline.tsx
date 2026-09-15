import React from "react";
import { formatDateTime } from "@/lib/utils";
import { Activity, Clock } from "lucide-react";

interface ActivityTimelineProps {
  logs: any[];
}

export function ActivityTimeline({ logs }: ActivityTimelineProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6 mb-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-600" />
            Log Aktivitas & Jejak Audit (Audit Trail)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rekaman mutasi data, upload, submit, revisi, verifikasi, dan download closing.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg shrink-0">
          {logs.length} Aktivitas
        </span>
      </div>

      {logs.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-2">Belum ada log aktivitas.</p>
      ) : (
        /* Scrollable container to prevent extending the page length */
        <div className="max-h-72 sm:max-h-80 overflow-y-auto pr-3 pl-3 py-1">
          <div className="relative pl-4 border-l-2 border-slate-200 space-y-4 text-xs">
            {logs.map((log) => (
              <div key={log.id} className="relative">
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white shadow-xs" />
                <div className="flex items-center justify-between text-slate-400 text-[11px] mb-0.5">
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {formatDateTime(log.createdAt)}
                  </span>
                  <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                    {log.action}
                  </span>
                </div>
                <div className="font-semibold text-slate-800">{log.description}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Aktor: <span className="font-medium text-slate-700">{log.actor?.name || "Sistem"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
