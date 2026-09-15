"use client";

import React, { useState, useTransition } from "react";
import {
  Users,
  PlusCircle,
  Edit2,
  KeyRound,
  CheckCircle2,
  XCircle,
  Search,
  Building2,
  Shield,
  UserCheck,
  SlidersHorizontal,
} from "lucide-react";
import { Role } from "@prisma/client";
import { useRouter } from "next/navigation";
import { triggerRealtimeAction } from "@/components/providers/RealtimeProvider";
import { UserFormModal, ResetPasswordModal, UserActionModal } from "./UserModals";
import { toggleUserActiveAction } from "@/actions/admin";
import { toast } from "sonner";

interface BranchOption {
  id: string;
  name: string;
  code: string;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId: string | null;
  authorizedBranchIds: string | null;
  active: boolean;
  createdAt: Date | string;
  branch: { id: string; name: string; code: string } | null;
  _count: {
    closings: number;
    verifiedClosings: number;
  };
}

interface UserListViewProps {
  initialUsers: UserItem[];
  branches: BranchOption[];
}

export function UserListView({ initialUsers, branches }: UserListViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | Role>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenAction = (user: UserItem) => {
    setSelectedUser(user);
    setIsActionOpen(true);
  };

  const handleOpenAdd = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: UserItem) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleOpenReset = (user: UserItem) => {
    setSelectedUser(user);
    setIsResetOpen(true);
  };

  const handleToggleActive = (user: UserItem) => {
    const newStatus = !user.active;
    const actionLabel = newStatus ? "mengaktifkan" : "menonaktifkan";

    toast(`Apakah Anda yakin ingin ${actionLabel} akun ${user.name}?`, {
      action: {
        label: newStatus ? "Aktifkan" : "Nonaktifkan",
        onClick: () => {
          startTransition(async () => {
            try {
              const res = await toggleUserActiveAction(user.id, newStatus);
              if (res?.error) {
                toast.error(res.error);
              } else {
                toast.success(`Akun ${user.name} berhasil di${newStatus ? "aktifkan" : "nonaktifkan"}.`);
                triggerRealtimeAction();
                router.refresh();
              }
            } catch (err: any) {
              toast.error(err.message || "Gagal mengubah status akun.");
            }
          });
        },
      },
    });
  };

  const filteredUsers = initialUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === "ALL" ? true : u.role === roleFilter;

    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "ACTIVE"
        ? u.active
        : !u.active;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (!parts.length || !parts[0]) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const renderAuthorizedBranches = (branchIdsStr: string | null) => {
    if (!branchIdsStr) {
      return (
        <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
          <Shield className="w-3 h-3 shrink-0" /> Seluruh Cabang
        </span>
      );
    }
    const ids = branchIdsStr.split(",").map((s) => s.trim()).filter(Boolean);
    const matchedNames = ids
      .map((id) => {
        const b = branches.find((branch) => branch.id === id || branch.code.toLowerCase() === id.toLowerCase());
        return b ? `${b.name} (${b.code})` : id.length > 8 ? id.slice(0, 8) + "…" : id;
      })
      .join(", ");

    return (
      <span className="text-slate-700 text-xs font-medium" title={branchIdsStr}>
        {matchedNames}
      </span>
    );
  };

  const hasActiveFilters = search.trim() !== "" || roleFilter !== "ALL" || statusFilter !== "ALL";

  const handleClearFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
  };

  return (
    <>
      <div className="space-y-3">
        {/* Filter & Action Toolbar - Compact */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-xs space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            {/* Search Bar */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama / email..."
                className="w-full pl-8 pr-7 py-1.5 border border-slate-300 rounded-lg text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold leading-none"
                  aria-label="Hapus"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Dropdowns + Tambah Button */}
            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="flex-1 sm:flex-initial px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium text-slate-700"
              >
                <option value="ALL">Semua Role</option>
                <option value={Role.STAFF_CABANG}>Cabang</option>
                <option value={Role.STAFF_PUSAT}>Pusat</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="flex-1 sm:flex-initial px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium text-slate-700"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>

              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0 w-full sm:w-auto"
              >
                <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Tambah Pengguna</span>
              </button>
            </div>
          </div>

          {(hasActiveFilters || filteredUsers.length !== initialUsers.length) && (
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <span>
                Menampilkan <strong className="text-slate-800">{filteredUsers.length}</strong> dari {initialUsers.length} pengguna
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-amber-600 hover:text-amber-700 font-semibold underline underline-offset-2 cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>
          )}
        </div>

        {/* User List Container */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Mobile Touch Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredUsers.length === 0 ? (
              <div className="py-10 px-4 text-center text-slate-400 space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700 text-xs">Tidak ada data pengguna</p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="inline-block mt-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Hapus Filter
                  </button>
                )}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="p-3 space-y-2">
                  {/* Header info with Avatar */}
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        user.role === Role.STAFF_PUSAT
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {getInitials(user.name)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <h4 className="font-bold text-slate-900 text-xs leading-tight truncate">
                          {user.name}
                        </h4>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            user.active
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.active ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          {user.active ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Role & Branch Details */}
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between text-[11px] gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        user.role === Role.STAFF_PUSAT
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {user.role === Role.STAFF_PUSAT ? "PUSAT" : "CABANG"}
                    </span>

                    <div className="flex items-center gap-1 text-slate-600 min-w-0 truncate text-[11px]">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate font-medium">
                        {user.role === Role.STAFF_CABANG
                          ? user.branch
                            ? `${user.branch.name} (${user.branch.code})`
                            : "Belum ditetapkan"
                          : user.authorizedBranchIds
                          ? user.authorizedBranchIds
                          : "Seluruh Cabang"}
                      </span>
                    </div>
                  </div>

                  {/* Action Button that triggers Action Modal */}
                  <div className="pt-1.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleOpenAction(user)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold active:scale-95 transition-all shadow-2xs cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                      <span>Aksi & Kelola</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View - Streamlined */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[620px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] bg-slate-50">
                  <th className="py-2.5 px-3.5">Pengguna</th>
                  <th className="py-2.5 px-3.5">Role</th>
                  <th className="py-2.5 px-3.5">Penugasan / Cabang</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600">Tidak ada pengguna ditemukan</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Coba ubah kata kunci filter atau tambah pengguna baru.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 ${
                              user.role === Role.STAFF_PUSAT
                                ? "bg-indigo-100 text-indigo-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {getInitials(user.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 leading-tight truncate">
                              {user.name}
                            </div>
                            <div className="text-slate-500 font-mono text-[11px] truncate">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            user.role === Role.STAFF_PUSAT
                              ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {user.role === Role.STAFF_PUSAT ? "PUSAT" : "CABANG"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-700">
                        {user.role === Role.STAFF_CABANG ? (
                          user.branch ? (
                            <div className="flex items-center gap-1.5 font-medium">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>
                                {user.branch.name} ({user.branch.code})
                              </span>
                            </div>
                          ) : (
                            <span className="text-red-500 italic">Belum dipilih</span>
                          )
                        ) : (
                          renderAuthorizedBranches(user.authorizedBranchIds)
                        )}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            user.active
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          {user.active ? (
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
                      <td className="py-2.5 px-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenAction(user)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-all shadow-2xs cursor-pointer active:scale-95"
                        >
                          <SlidersHorizontal className="w-3 h-3 text-slate-500" />
                          <span>Aksi</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Form Modal (Create / Edit) */}
      <UserFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        branches={branches}
        userToEdit={selectedUser}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        user={selectedUser}
      />

      {/* Action Modal (Modal Aksi) */}
      <UserActionModal
        isOpen={isActionOpen}
        onClose={() => setIsActionOpen(false)}
        user={selectedUser}
        onEdit={(u) => handleOpenEdit(u as any)}
        onResetPassword={(u) => handleOpenReset(u as any)}
        onToggleActive={(u) => handleToggleActive(u as any)}
        isPending={isPending}
      />
    </>
  );
}
