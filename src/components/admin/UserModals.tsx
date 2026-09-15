"use client";

import React, { useState, useTransition } from "react";
import {
  X,
  UserPlus,
  UserCheck,
  KeyRound,
  AlertCircle,
  Edit2,
  XCircle,
  CheckCircle2,
  ChevronRight,
  Building2,
  Shield,
  SlidersHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { triggerRealtimeAction } from "@/components/providers/RealtimeProvider";
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
  const router = useRouter();
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
          triggerRealtimeAction();
          router.refresh();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-4 sm:p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
              {isEditing ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                {isEditing ? "Edit Data Pengguna" : "Tambah Pengguna & Akun Baru"}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                {isEditing
                  ? "Perbarui profil, role, atau cabang tugas"
                  : "Buat kredensial akun baru untuk staf cabang atau staf pusat"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs overflow-y-auto pr-1">
          <div>
            <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={userToEdit?.name || ""}
              placeholder="Contoh: Budi Santoso"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-sm sm:text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">
              Alamat Email (Digunakan untuk Login) <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              disabled={isEditing}
              defaultValue={userToEdit?.email || ""}
              placeholder="Contoh: staff.surabaya@closinglm.id"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-sm sm:text-xs disabled:bg-slate-100 disabled:text-slate-500"
            />
            {isEditing && (
              <p className="text-[11px] text-slate-400 mt-1">
                Alamat email login bersifat permanen.
              </p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">
              Role Pengguna <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as Role)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-sm sm:text-xs bg-white font-medium"
            >
              <option value={Role.STAFF_CABANG}>STAFF CABANG (Input & Upload Dokumen)</option>
              <option value={Role.STAFF_PUSAT}>STAFF PUSAT (Review, Revisi & Verifikasi)</option>
            </select>
          </div>

          {selectedRole === Role.STAFF_CABANG && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">
                Cabang Penugasan <span className="text-red-500">*</span>
              </label>
              <select
                name="branchId"
                required
                defaultValue={userToEdit?.branchId || ""}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-sm sm:text-xs bg-white"
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
              <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">
                Lingkup Wewenang Cabang
              </label>
              <p className="text-[11px] text-slate-500 mb-1.5 leading-relaxed">
                Kosongkan untuk memberikan akses ke <strong>seluruh cabang</strong> (default). Atau masukkan ID cabang dipisah koma jika dibatasi.
              </p>
              <input
                type="text"
                name="authorizedBranchIds"
                defaultValue={userToEdit?.authorizedBranchIds || ""}
                placeholder="Biarkan kosong untuk akses semua cabang"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-sm sm:text-xs"
              />
            </div>
          )}

          {!isEditing && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">
                Kata Sandi Awal <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                required
                placeholder="Minimal 6 karakter"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-sm sm:text-xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Staf dapat mengubah kata sandi ini setelah berhasil login.
              </p>
            </div>
          )}

          {isEditing && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">
                Status Akun
              </label>
              <select
                name="active"
                defaultValue={userToEdit.active ? "true" : "false"}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-sm sm:text-xs bg-white"
              >
                <option value="true">Aktif (Dapat Login ke Sistem)</option>
                <option value="false">Nonaktif (Akses Diblokir)</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 sm:py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer flex-1 sm:flex-initial text-center"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2.5 sm:py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex-1 sm:flex-initial text-center"
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
  const router = useRouter();
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
          triggerRealtimeAction();
          router.refresh();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-4 sm:p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                Reset Kata Sandi
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                {user.name} ({user.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1 text-[11px] sm:text-xs">
              Kata Sandi Baru
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Masukkan kata sandi baru (min 6 karakter)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-sm sm:text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 sm:py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer flex-1 sm:flex-initial text-center"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2.5 sm:py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex-1 sm:flex-initial text-center"
            >
              {isPending ? "Mereset..." : "Reset Kata Sandi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface UserActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData | null;
  onEdit: (user: UserData) => void;
  onResetPassword: (user: UserData) => void;
  onToggleActive: (user: UserData) => void;
  isPending?: boolean;
}

export function UserActionModal({
  isOpen,
  onClose,
  user,
  onEdit,
  onResetPassword,
  onToggleActive,
  isPending,
}: UserActionModalProps) {
  if (!isOpen || !user) return null;

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (!parts.length || !parts[0]) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-4 sm:p-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">
              Aksi Pengguna
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card Summary */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 mb-3.5 flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              user.role === Role.STAFF_PUSAT
                ? "bg-indigo-100 text-indigo-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {getInitials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <h4 className="font-bold text-slate-900 text-xs truncate leading-tight">
                {user.name}
              </h4>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                  user.active
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {user.active ? "AKTIF" : "NONAKTIF"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
              {user.email}
            </p>
          </div>
        </div>

        {/* Action List Buttons */}
        <div className="space-y-2">
          {/* Action 1: Edit Data & Role */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(user);
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 transition-all text-left cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-amber-100 text-slate-600 group-hover:text-amber-700 transition-colors shrink-0">
                <Edit2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  Edit Data & Penugasan
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                  Perbarui nama, role, cabang tugas
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
          </button>

          {/* Action 2: Reset Kata Sandi */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onResetPassword(user);
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 transition-all text-left cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                <KeyRound className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  Reset Kata Sandi
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                  Setel ulang kata sandi login pengguna
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
          </button>

          {/* Action 3: Blokir / Aktifkan Akun */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              onClose();
              onToggleActive(user);
            }}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer group ${
              user.active
                ? "border-red-200 hover:bg-red-50 text-red-700"
                : "border-emerald-200 hover:bg-emerald-50 text-emerald-700"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  user.active ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {user.active ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold leading-tight">
                  {user.active ? "Nonaktifkan / Blokir Akun" : "Aktifkan Akun"}
                </div>
                <div className="text-[10px] opacity-80 mt-0.5 truncate">
                  {user.active
                    ? "Cegah akun staf ini login ke sistem"
                    : "Izinkan kembali pengguna login"}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 opacity-50 shrink-0" />
          </button>
        </div>

        {/* Close Button */}
        <div className="pt-3 mt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer text-center"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

