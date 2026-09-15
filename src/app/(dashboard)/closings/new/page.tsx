import React from "react";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { BranchService } from "@/modules/branch/branch.service";
import { CreateClosingForm } from "./CreateClosingForm";
import { Role } from "@prisma/client";

export default async function NewClosingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Only Staff Cabang can create closing according to workflow
  if (user.role !== Role.STAFF_CABANG) {
    redirect("/dashboard");
  }

  const branches = await BranchService.listBranchesForUser(user);

  return (
    <div className="max-w-xl mx-auto py-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-8">
        <h1 className="text-xl font-bold text-slate-900 mb-1">
          Buat Closing Harian Baru
        </h1>
        <p className="text-xs text-slate-500 mb-6">
          Inisialisasi lembar kerja closing harian cabang. Sistem akan otomatis menyiapkan 11 item checklist standar logam mulia.
        </p>

        <CreateClosingForm user={user} branches={branches} />
      </div>
    </div>
  );
}
