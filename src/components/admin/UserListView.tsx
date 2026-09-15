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

  return (
    <>
      <div className="space-y-4">
        {/* Filter & Action Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex flex-1 flex-wrap items-center gap-2 max-w-xl">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau email pengguna..."
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
            >
              <option value="ALL">Semua Role</option>
              <option value={Role.STAFF_CABANG}>STAFF CABANG</option>
              <option value={Role.STAFF_PUSAT}>STAFF PUSAT</option>
            </select>

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
            <span>Tambah Pengguna Baru</span>
          </button>
        </div>

        {/* User List Container */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Mobile Touch Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredUsers.length === 0 ? (
              <div className="py-12 px-4 text-center text-slate-400">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600 text-xs">Tidak ada pengguna ditemukan</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{user.name}</h4>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            user.role === Role.STAFF_PUSAT
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {user.role === Role.STAFF_PUSAT ? "KANTOR PUSAT" : "CABANG"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        user.active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {user.active ? "AKTIF" : "NONAKTIF"}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {user.role === Role.STAFF_CABANG
                        ? user.branch
                          ? `${user.branch.name} (${user.branch.code})`
                          : "Belum ditetapkan cabang"
                        : user.authorizedBranchIds
                        ? `Wewenang: ${user.authorizedBranchIds}`
                        : "Wewenang: Seluruh Cabang"}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleOpenReset(user)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      title="Reset kata sandi"
                    >
                      <KeyRound className="w-3 h-3 text-amber-600" />
                      <span>Reset Sandi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(user)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(user)}
                      disabled={isPending}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        user.active
                          ? "border border-red-200 text-red-600 hover:bg-red-50"
                          : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {user.active ? "Blokir" : "Aktifkan"}
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
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">Email Login</th>
                  <th className="py-3 px-4">Role Akun</th>
                  <th className="py-3 px-4">Penugasan Cabang / Wewenang</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600">Tidak ada pengguna ditemukan</p>
                      <p className="text-[11px] text-slate-400">Coba ubah kata kunci filter atau tambah pengguna baru.</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {user.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                        {user.email}
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
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>{user.branch.name} ({user.branch.code})</span>
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
                            <Shield className="w-3 h-3" /> Seluruh Cabang (Full Access)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
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
