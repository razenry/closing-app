"use client";

import React, { useState, useTransition } from "react";
import { X, UserPlus, UserCheck, KeyRound, AlertCircle } from "lucide-react";
import { createUserAction, updateUserAction, resetUserPasswordAction } from "@/actions/admin";
import { Role } from "@prisma/client";
import { toast } from "sonner";

interface BranchOption {
  id: string;
  name: string;
  code: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId?: string | null;
  authorizedBranchIds?: string | null;
  active: boolean;
  branch?: { id: string; name: string; code: string } | null;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: BranchOption[];
  userToEdit?: UserData | null;
}

export function UserFormModal({
  isOpen,
  onClose,
  branches,
  userToEdit,
}: UserFormModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!userToEdit;
  const [selectedRole, setSelectedRole] = useState<Role>(
    userToEdit?.role || Role.STAFF_CABANG
  );

  React.useEffect(() => {
    if (userToEdit) {
      setSelectedRole(userToEdit.role);
    } else {
      setSelectedRole(Role.STAFF_CABANG);
    }
    setError(null);
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = isEditing
          ? await updateUserAction(userToEdit.id, formData)
          : await createUserAction(formData);

        if (res?.error) {
          setError(res.error);
          toast.error(res.error);
        } else {
          toast.success(
            isEditing
              ? `Pengguna ${formData.get("name")} berhasil diperbarui!`
              : `Pengguna ${formData.get("name")} berhasil didaftarkan!`
          );
          onClose();
        }
      } catch (err: any) {
        const msg = err.message || "Terjadi kesalahan.";
        setError(msg);
        toast.error(msg);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              {isEditing ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {isEditing ? "Edit Data Pengguna" : "Tambah Pengguna & Akun Baru"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEditing
                  ? "Perbarui profil, role, atau cabang tugas"
                  : "Buat kredensial akun baru untuk staf cabang atau staf pusat"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={userToEdit?.name || ""}
              placeholder="Contoh: Budi Santoso"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Alamat Email (Digunakan untuk Login) <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              disabled={isEditing}
              defaultValue={userToEdit?.email || ""}
              placeholder="Contoh: staff.surabaya@closinglm.id"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs disabled:bg-slate-100 disabled:text-slate-500"
            />
            {isEditing && (
              <p className="text-[11px] text-slate-400 mt-1">
                Alamat email login bersifat permanen.
              </p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Role Pengguna <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs bg-white font-medium"
            >
              <option value={Role.STAFF_CABANG}>STAFF CABANG (Input & Upload Dokumen)</option>
              <option value={Role.STAFF_PUSAT}>STAFF PUSAT (Review, Revisi & Verifikasi)</option>
            </select>
          </div>

          {selectedRole === Role.STAFF_CABANG && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Cabang Penugasan <span className="text-red-500">*</span>
              </label>
              <select
                name="branchId"
                required
                defaultValue={userToEdit?.branchId || ""}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs bg-white"
              >
                <option value="">-- Pilih Cabang --</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedRole === Role.STAFF_PUSAT && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lingkup Wewenang Cabang
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Kosongkan untuk memberikan akses ke <strong>seluruh cabang</strong> (default). Atau masukkan ID cabang dipisah koma jika dibatasi.
              </p>
              <input
                type="text"
                name="authorizedBranchIds"
                defaultValue={userToEdit?.authorizedBranchIds || ""}
                placeholder="Biarkan kosong untuk akses semua cabang"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs"
              />
            </div>
          )}

          {!isEditing && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kata Sandi Awal <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                required
                placeholder="Minimal 6 karakter"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Staf dapat mengubah kata sandi ini setelah berhasil login.
              </p>
            </div>
          )}

          {isEditing && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Status Akun
              </label>
              <select
                name="active"
                defaultValue={userToEdit.active ? "true" : "false"}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs bg-white"
              >
                <option value="true">Aktif (Dapat Login ke Sistem)</option>
                <option value="false">Nonaktif (Akses Diblokir)</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Daftarkan Pengguna"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData | null;
}

export function ResetPasswordModal({
  isOpen,
  onClose,
  user,
}: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Kata sandi baru minimal 6 karakter.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await resetUserPasswordAction(user.id, newPassword);
        if (res?.error) {
          setError(res.error);
          toast.error(res.error);
        } else {
          toast.success(`Kata sandi untuk ${user.name} berhasil direset!`);
          setNewPassword("");
          onClose();
        }
      } catch (err: any) {
        const msg = err.message || "Gagal mereset kata sandi.";
        setError(msg);
        toast.error(msg);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Reset Kata Sandi
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{user.name} ({user.email})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Kata Sandi Baru
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Masukkan kata sandi baru (min 6 karakter)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isPending ? "Mereset..." : "Reset Kata Sandi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
