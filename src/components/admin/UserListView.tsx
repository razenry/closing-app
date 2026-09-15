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
} from "lucide-react";
import { Role } from "@prisma/client";
import { UserFormModal, ResetPasswordModal } from "./UserModals";
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
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | Role>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [isPending, startTransition] = useTransition();

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

  const hasActiveFilters = search.trim() !== "" || roleFilter !== "ALL" || statusFilter !== "ALL";

  const handleClearFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
  };

  return (
    <>
      <div className="space-y-4">
        {/* Filter & Action Toolbar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 sm:top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau email pengguna..."
                className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-xs sm:text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  aria-label="Hapus pencarian"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Tambah Pengguna Baru Button (Desktop & Mobile) */}
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer w-full sm:w-auto shrink-0"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Tambah Pengguna Baru</span>
            </button>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="w-full sm:w-auto px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium text-slate-700"
              >
                <option value="ALL">Semua Role</option>
                <option value={Role.STAFF_CABANG}>STAFF CABANG</option>
                <option value={Role.STAFF_PUSAT}>STAFF PUSAT</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full sm:w-auto px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium text-slate-700"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Status: Aktif</option>
                <option value="INACTIVE">Status: Nonaktif</option>
              </select>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 text-[11px] text-slate-500">
              <span>
                Menampilkan <strong className="text-slate-800">{filteredUsers.length}</strong> dari{" "}
                {initialUsers.length}
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
          </div>
        </div>

        {/* User List Container */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Mobile Touch Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredUsers.length === 0 ? (
              <div className="py-12 px-4 text-center text-slate-400 space-y-2">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700 text-xs">Tidak ada pengguna ditemukan</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Coba ganti kata kunci pencarian atau ubah filter role dan status di atas.
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="inline-block mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Hapus Filter
                  </button>
                )}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="p-3.5 space-y-2.5">
                  {/* Header info with Avatar */}
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                        user.role === Role.STAFF_PUSAT
                          ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {getInitials(user.name)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">
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
                              user.active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                            }`}
                          />
                          {user.active ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Role & Branch Details */}
                  <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Role Akun:</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          user.role === Role.STAFF_PUSAT
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {user.role === Role.STAFF_PUSAT ? "KANTOR PUSAT" : "STAFF CABANG"}
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5 text-[11px] text-slate-700">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="break-words font-medium">
                        {user.role === Role.STAFF_CABANG ? (
                          user.branch ? (
                            `${user.branch.name} (${user.branch.code})`
                          ) : (
                            <span className="text-red-500 italic">Belum ditentukan cabang</span>
                          )
                        ) : user.authorizedBranchIds ? (
                          `Wewenang: ${user.authorizedBranchIds}`
                        ) : (
                          "Wewenang: Seluruh Cabang (Full)"
                        )}
                      </span>
                    </div>
                  </div>

                  {/* 3-Column Action Buttons for Touch */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleOpenReset(user)}
                      className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-lg border border-slate-200 hover:border-amber-300 bg-white hover:bg-amber-50/40 text-slate-700 text-xs font-semibold active:scale-95 transition-all cursor-pointer min-h-[36px]"
                      title="Reset kata sandi pengguna"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Sandi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(user)}
                      className="inline-flex items-center justify-center gap-1 py-2 px-2 rounded-lg border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold active:scale-95 transition-all cursor-pointer min-h-[36px]"
                      title="Edit data dan penugasan"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(user)}
                      disabled={isPending}
                      className={`inline-flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-xs font-semibold active:scale-95 transition-all cursor-pointer min-h-[36px] ${
                        user.active
                          ? "border border-red-200 bg-white hover:bg-red-50 text-red-600"
                          : "border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700"
                      }`}
                      title={user.active ? "Nonaktifkan / Blokir akun" : "Aktifkan kembali akun"}
                    >
                      {user.active ? (
                        <>
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Blokir</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Aktifkan</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] bg-slate-50">
                  <th className="py-3 px-4">Pengguna</th>
                  <th className="py-3 px-4">Role Akun</th>
                  <th className="py-3 px-4">Penugasan Cabang / Wewenang</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
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
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              user.role === Role.STAFF_PUSAT
                                ? "bg-indigo-100 text-indigo-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {getInitials(user.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 leading-tight">
                              {user.name}
                            </div>
                            <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                            user.role === Role.STAFF_PUSAT
                              ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {user.role === Role.STAFF_PUSAT ? "KANTOR PUSAT" : "STAFF CABANG"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
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
                        ) : user.authorizedBranchIds ? (
                          <span className="text-slate-600 text-[11px]">
                            Terbatas: {user.authorizedBranchIds}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                            <Shield className="w-3 h-3 shrink-0" /> Seluruh Cabang (Full Access)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
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
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenReset(user)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-amber-800 border border-slate-200 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            title="Reset kata sandi pengguna"
                          >
                            <KeyRound className="w-3 h-3 text-amber-600" />
                            <span>Sandi</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            className="px-2.5 py-1 text-slate-700 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            title="Edit data dan role"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleActive(user)}
                            disabled={isPending}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                              user.active
                                ? "border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50"
                                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            {user.active ? "Nonaktifkan" : "Aktifkan"}
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
    </>
  );
}
