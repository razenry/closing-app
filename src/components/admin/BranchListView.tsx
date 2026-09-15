"use client";

import React, { useState, useTransition } from "react";
import {
  Building2,
  PlusCircle,
  Edit2,
  CheckCircle2,
  XCircle,
  Search,
  Users,
  FileText,
} from "lucide-react";
import { BranchFormModal } from "./BranchModals";
import { toggleBranchActiveAction } from "@/actions/admin";
import { toast } from "sonner";

interface BranchItem {
  id: string;
  name: string;
  code: string;
  active: boolean;
  createdAt: Date | string;
  _count: {
    users: number;
    closings: number;
  };
}

interface BranchListViewProps {
  initialBranches: BranchItem[];
}

export function BranchListView({ initialBranches }: BranchListViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<BranchItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenAdd = () => {
    setSelectedBranch(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (branch: BranchItem) => {
    setSelectedBranch(branch);
    setIsModalOpen(true);
  };

  const handleToggleActive = (branch: BranchItem) => {
    const newStatus = !branch.active;
    const actionLabel = newStatus ? "mengaktifkan" : "menonaktifkan";

    toast(`Apakah Anda yakin ingin ${actionLabel} ${branch.name}?`, {
      action: {
        label: newStatus ? "Aktifkan" : "Nonaktifkan",
        onClick: () => {
          startTransition(async () => {
            try {
              const res = await toggleBranchActiveAction(branch.id, newStatus);
              if (res?.error) {
                toast.error(res.error);
              } else {
                toast.success(`Cabang ${branch.name} berhasil di${newStatus ? "aktifkan" : "nonaktifkan"}.`);
              }
            } catch (err: any) {
              toast.error(err.message || "Gagal mengubah status cabang.");
            }
          });
        },
      },
    });
  };

  const filteredBranches = initialBranches.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "ACTIVE"
        ? b.active
        : !b.active;

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="space-y-4">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex flex-1 items-center gap-2 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau kode cabang..."
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Nonaktif</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah Cabang Baru</span>
          </button>
        </div>

        {/* Branch List Container */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Mobile Touch Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredBranches.length === 0 ? (
              <div className="py-12 px-4 text-center text-slate-400">
                <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600 text-xs">Tidak ada cabang ditemukan</p>
              </div>
            ) : (
              filteredBranches.map((branch) => (
                <div key={branch.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{branch.name}</h4>
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] font-bold text-slate-700">
                          {branch.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          {branch._count.users} Staf
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-400" />
                          {branch._count.closings} Closing
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        branch.active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {branch.active ? "AKTIF" : "NONAKTIF"}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(branch)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(branch)}
                      disabled={isPending}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                        branch.active
                          ? "border border-red-200 text-red-600 hover:bg-red-50"
                          : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {branch.active ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] bg-slate-50">
                  <th className="py-3 px-4">Nama Cabang</th>
                  <th className="py-3 px-4">Kode Cabang</th>
                  <th className="py-3 px-4">Jumlah Staf</th>
                  <th className="py-3 px-4">Total Closing</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBranches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600">Tidak ada cabang ditemukan</p>
                      <p className="text-[11px] text-slate-400">Coba ubah kata kunci pencarian atau tambah cabang baru.</p>
                    </td>
                  </tr>
                ) : (
                  filteredBranches.map((branch) => (
                    <tr key={branch.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span>{branch.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-bold text-slate-800">
                          {branch.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {branch._count.users} Staf
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="inline-flex items-center gap-1 font-medium">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          {branch._count.closings} Dokumen
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            branch.active
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          {branch.active ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Aktif
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-400" />
                              Nonaktif
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(branch)}
                            className="px-2.5 py-1 text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            title="Edit nama dan kode"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(branch)}
                            disabled={isPending}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                              branch.active
                                ? "border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50"
                                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            {branch.active ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Branch Form Modal */}
      <BranchFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        branchToEdit={selectedBranch}
      />
    </>
  );
}
