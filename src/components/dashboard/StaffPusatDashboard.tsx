import React from "react";
import Link from "next/link";
import { AuthUser } from "@/lib/permissions";
import { StatusBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils";
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  Building2,
} from "lucide-react";

interface StaffPusatDashboardProps {
  user: AuthUser;
  stats: {
    total: number;
    verified: number;
    submitted: number;
    revisionRequired: number;
    averageCompleteness: number;
  };
  needAttention: any[];
}

export function StaffPusatDashboard({
  user,
  stats,
  needAttention,
}: StaffPusatDashboardProps) {
  const statCards = [
    {
      label: "Total Closing",
      value: stats.total,
      icon: FileText,
      color: "text-slate-700",
      bg: "bg-slate-100",
    },
    {
      label: "Menunggu Review",
      value: stats.submitted,
      icon: Clock,
      color: "text-blue-700",
      bg: "bg-blue-100",
      alert: stats.submitted > 0,
    },
    {
      label: "Perlu Revisi",
      value: stats.revisionRequired,
      icon: AlertTriangle,
      color: "text-amber-700",
      bg: "bg-amber-100",
    },
    {
      label: "Terverifikasi",
      value: stats.verified,
      icon: CheckCircle2,
      color: "text-emerald-700",
      bg: "bg-emerald-100",
    },
    {
      label: "Rata-rata Kelengkapan",
      value: `${stats.averageCompleteness}%`,
      icon: BarChart3,
      color: "text-indigo-700",
      bg: "bg-indigo-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`bg-white p-4 rounded-xl border ${
                card.alert ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200"
              } shadow-xs flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-500">{card.label}</span>
                <div className={`p-1.5 rounded-md ${card.bg} ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-slate-900">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* 2. Need Attention Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-base font-bold text-slate-900">
                Memerlukan Perhatian Kantor Pusat (Need Attention)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar closing cabang dengan status <strong>SUBMITTED</strong> (menunggu verifikasi) atau <strong>REVISION_REQUIRED</strong>.
            </p>
          </div>
          <Link
            href="/closings"
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            Lihat Semua
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {needAttention.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100">
            <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-700">Semua Closing Terkendali</div>
            <div className="text-xs text-slate-400">Tidak ada closing yang menunggu tindakan saat ini.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] bg-slate-50">
                  <th className="py-2.5 px-3">Cabang</th>
                  <th className="py-2.5 px-3">Staff Pembuat</th>
                  <th className="py-2.5 px-3">Tanggal Closing</th>
                  <th className="py-2.5 px-3">Kelengkapan</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {needAttention.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.branch.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {item.createdBy.name}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">
                      {formatDate(item.closingDate)}
                    </td>
                    <td className="py-3 px-3 w-40">
                      <ProgressBar percentage={item.completenessPercentage} showText={false} />
                      <span className="text-[10px] text-slate-500 font-semibold mt-0.5 inline-block">
                        {item.completenessPercentage}%
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/closings/${item.id}`}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors ${
                          item.status === "SUBMITTED"
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                        }`}
                      >
                        {item.status === "SUBMITTED" ? "Review & Verifikasi" : "Lihat Revisi"}
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
