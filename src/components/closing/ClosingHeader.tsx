"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { AuthUser, PermissionService } from "@/lib/permissions";
import { ClosingWithRelations } from "@/modules/closing/closing.types";
import { ClosingStatus, Role } from "@prisma/client";
import { StatusBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { formatDate, formatDateTime } from "@/lib/utils";
import { submitClosingAction, verifyClosingAction, startFixingRevisionAction } from "@/actions/closing";
import { RevisionModal } from "./RevisionModal";
import { ShareLinkModal } from "./ShareLinkModal";
import { UploadModal } from "./UploadModal";
import {
  Building2,
  Calendar,
  User,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Download,
  Share2,
  ChevronLeft,
  FileArchive,
  RefreshCw,
} from "lucide-react";

interface ClosingHeaderProps {
  closing: ClosingWithRelations;
  currentUser: AuthUser;
}

export function ClosingHeader({ closing, currentUser }: ClosingHeaderProps) {
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isStaffCabang = currentUser.role === Role.STAFF_CABANG;
  const isStaffPusat = currentUser.role === Role.STAFF_PUSAT;

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const res = await submitClosingAction(closing.id);
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  const handleStartFix = () => {
    setError(null);
    startTransition(async () => {
      const res = await startFixingRevisionAction(closing.id);
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  const handleVerify = () => {
    if (!confirm("Apakah Anda yakin ingin memverifikasi closing ini? Setelah diverifikasi, dokumen tidak dapat diubah secara bebas.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await verifyClosingAction(closing.id);
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  return (
    <>
      <div className="bg-white border-b border-slate-200 -mx-4 sm:-mx-6 -mt-6 p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
          <Link href="/closings" className="hover:text-slate-800 flex items-center gap-1">
            <ChevronLeft className="w-3.5 h-3.5" />
            Riwayat Closing
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-700">Detail Closing #{closing.id.substring(0, 8)}</span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <pre className="whitespace-pre-wrap font-sans">{error}</pre>
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {closing.branch.name}
              </h1>
              <StatusBadge status={closing.status} />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-700">{formatDate(closing.closingDate)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Kode: {closing.branch.code}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Dibuat oleh: {closing.createdBy.name}</span>
              </div>
              {closing.verifiedBy && (
                <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Diverifikasi oleh: {closing.verifiedBy.name} ({formatDateTime(closing.verifiedAt)})</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Download All ZIP */}
            <a
              href={`/api/files/closing/${closing.id}/download-all`}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileArchive className="w-3.5 h-3.5 text-slate-600" />
              <span>Unduh ZIP</span>
            </a>

            {/* Share Link */}
            <button
              onClick={() => setIsShareOpen(true)}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Bagikan</span>
            </button>

            {/* Staff Cabang: Upload File button */}
            {isStaffCabang && (closing.status === ClosingStatus.DRAFT || closing.status === ClosingStatus.REVISION_REQUIRED) && (
              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-3 py-2 text-xs font-semibold text-slate-800 bg-amber-400 hover:bg-amber-500 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah Dokumen</span>
              </button>
            )}

            {/* Staff Cabang: Start fix revision button */}
            {isStaffCabang && closing.status === ClosingStatus.REVISION_REQUIRED && (
              <button
                onClick={handleStartFix}
                disabled={isPending}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
                <span>Perbaiki Dokumen</span>
              </button>
            )}

            {/* Staff Cabang: Submit Closing */}
            {isStaffCabang && closing.status === ClosingStatus.DRAFT && (
              <button
                onClick={handleSubmit}
                disabled={isPending || closing.completenessPercentage < 100}
                className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title={closing.completenessPercentage < 100 ? "Lengkapi semua 11 checklist sebelum submit" : ""}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim ke Pusat</span>
              </button>
            )}

            {/* Staff Pusat: Request Revision */}
            {isStaffPusat && closing.status === ClosingStatus.SUBMITTED && (
              <button
                onClick={() => setIsRevisionOpen(true)}
                className="px-3.5 py-2 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Minta Revisi</span>
              </button>
            )}

            {/* Staff Pusat: Verify Closing */}
            {isStaffPusat && closing.status === ClosingStatus.SUBMITTED && (
              <button
                onClick={handleVerify}
                disabled={isPending || closing.completenessPercentage < 100}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verifikasi Closing</span>
              </button>
            )}
          </div>
        </div>

        {/* Completeness Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 max-w-xl">
          <ProgressBar percentage={closing.completenessPercentage} />
        </div>
      </div>

      {/* Modals */}
      <RevisionModal
        closingId={closing.id}
        isOpen={isRevisionOpen}
        onClose={() => setIsRevisionOpen(false)}
      />

      <ShareLinkModal
        closingId={closing.id}
        shareLinks={closing.shareLinks}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />

      <UploadModal
        closingId={closing.id}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </>
  );
}
