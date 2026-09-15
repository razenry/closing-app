import React from "react";
import { getCurrentUser } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { ClosingService } from "@/modules/closing/closing.service";
import { ClosingHeader } from "@/components/closing/ClosingHeader";
import { ChecklistSection } from "@/components/closing/ChecklistSection";
import { MainDocsSection } from "@/components/closing/MainDocsSection";
import { RevisionTimeline } from "@/components/closing/RevisionTimeline";
import { ActivityTimeline } from "@/components/closing/ActivityTimeline";

interface ClosingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClosingDetailPage({ params }: ClosingDetailPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  let closing;
  try {
    closing = await ClosingService.getClosingDetail(user, id);
  } catch (err: any) {
    // Unauthorized branch access (e.g. Jogja staff trying to open Jakarta closing)
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800">
          <h2 className="text-base font-bold mb-1">Akses Ditolak (403 Unauthorized)</h2>
          <p className="text-xs text-red-600 mb-4">
            Anda tidak memiliki hak otorisasi untuk melihat atau mengelola closing cabang ini.
          </p>
          <a
            href="/dashboard"
            className="inline-block px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold"
          >
            Kembali ke Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (!closing) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* 1. Header with Status, Completeness & Actions */}
      <ClosingHeader closing={closing} currentUser={user} />

      {/* 2. Stock Checklist (9 items) */}
      <ChecklistSection closing={closing} currentUser={user} />

      {/* 3. Main Documentation (Stock Excel & Recap Photo) */}
      <MainDocsSection closing={closing} currentUser={user} />

      {/* 4. Revision History Timeline */}
      <RevisionTimeline revisions={closing.revisions} />

      {/* 5. Activity Log & Audit Trail */}
      <ActivityTimeline logs={closing.activityLogs} />
    </div>
  );
}
