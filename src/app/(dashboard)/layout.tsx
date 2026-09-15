import React from "react";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} />
      <div className="flex flex-1">
        <Sidebar user={user} />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 md:pb-8">
          {children}
        </main>
      </div>
      <MobileNav user={user} />
    </div>
  );
}

