"use server";

import { getCurrentUser } from "@/lib/session";
import { AdminService } from "@/modules/admin/admin.service";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

async function verifyStaffPusat() {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.STAFF_PUSAT) {
    throw new Error("Akses ditolak: Operasi ini hanya untuk Kantor Pusat.");
  }
  return user;
}

/**
 * =====================================
 * BRANCH SERVER ACTIONS
 * =====================================
 */

export async function createBranchAction(formData: FormData) {
  try {
    await verifyStaffPusat();
    const name = formData.get("name") as string;
    const code = formData.get("code") as string;

    const branch = await AdminService.createBranch({ name, code });
    revalidatePath("/admin/branches");
    revalidatePath("/admin/users");
    revalidatePath("/closings");
    return { success: true, branch };
  } catch (err: any) {
    return { error: err.message || "Gagal membuat cabang baru." };
  }
}

export async function updateBranchAction(id: string, formData: FormData) {
  try {
    await verifyStaffPusat();
    const name = formData.get("name") as string;
    const code = formData.get("code") as string;
    const active = formData.get("active") === "true";

    const branch = await AdminService.updateBranch(id, { name, code, active });
    revalidatePath("/admin/branches");
    revalidatePath("/admin/users");
    revalidatePath("/closings");
    return { success: true, branch };
  } catch (err: any) {
    return { error: err.message || "Gagal memperbarui data cabang." };
  }
}

export async function toggleBranchActiveAction(id: string, active: boolean) {
  try {
    await verifyStaffPusat();
    await AdminService.toggleBranchActive(id, active);
    revalidatePath("/admin/branches");
    revalidatePath("/closings");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Gagal mengubah status cabang." };
  }
}

/**
 * =====================================
 * USER & ACCOUNT SERVER ACTIONS
 * =====================================
 */

export async function createUserAction(formData: FormData) {
  try {
    await verifyStaffPusat();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const role = (formData.get("role") as Role) || Role.STAFF_CABANG;
    const branchId = (formData.get("branchId") as string) || null;
    const authorizedBranchIds = (formData.get("authorizedBranchIds") as string) || null;
    const password = formData.get("password") as string;

    const user = await AdminService.createUser({
      name,
      email,
      role,
      branchId,
      authorizedBranchIds,
      password,
    });

    revalidatePath("/admin/users");
    return { success: true, user };
  } catch (err: any) {
    return { error: err.message || "Gagal membuat pengguna baru." };
  }
}

export async function updateUserAction(id: string, formData: FormData) {
  try {
    await verifyStaffPusat();
    const name = formData.get("name") as string;
    const role = (formData.get("role") as Role) || Role.STAFF_CABANG;
    const branchId = (formData.get("branchId") as string) || null;
    const authorizedBranchIds = (formData.get("authorizedBranchIds") as string) || null;
    const active = formData.get("active") === "true";

    const user = await AdminService.updateUser(id, {
      name,
      role,
      branchId,
      authorizedBranchIds,
      active,
    });

    revalidatePath("/admin/users");
    return { success: true, user };
  } catch (err: any) {
    return { error: err.message || "Gagal memperbarui data pengguna." };
  }
}

export async function resetUserPasswordAction(userId: string, newPassword: string) {
  try {
    await verifyStaffPusat();
    await AdminService.resetUserPassword(userId, newPassword);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Gagal mereset kata sandi." };
  }
}

export async function toggleUserActiveAction(userId: string, active: boolean) {
  try {
    await verifyStaffPusat();
    await AdminService.toggleUserActive(userId, active);
    revalidatePath("/admin/users");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Gagal mengubah status akun." };
  }
}
