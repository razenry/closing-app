import React from "react";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { ClosingService } from "@/modules/closing/closing.service";
import { StaffCabangDashboard } from "@/components/dashboard/StaffCabangDashboard";
import { StaffPusatDashboard } from "@/components/dashboard/StaffPusatDashboard";
import { Role } from "@prisma/client";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const todayStr = "2026-09-15"; // Today's date aligned with simulation metadata

  if (user.role === Role.STAFF_PUSAT) {
    const { stats, needAttention } = await ClosingService.getDashboardForStaffPusat(user);
    return (
      <StaffPusatDashboard
        user={user}
        stats={stats}
        needAttention={needAttention}
      />
    );
  }

  const { todayClosing, recentClosings } = await ClosingService.getDashboardForStaffCabang(
    user,
    todayStr
  );

  return (
    <StaffCabangDashboard
      user={user}
      todayClosing={todayClosing}
      recentClosings={recentClosings}
    />
  );
}
