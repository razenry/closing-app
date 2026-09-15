"use server";

import { setCurrentUser, clearCurrentUser, getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword, hashPassword } from "@/lib/security/password";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan kata sandi wajib diisi." };
  }

  const cleanEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!user || !user.active) {
    return { error: "Akun tidak ditemukan atau tidak aktif." };
  }

  if (!user.passwordHash) {
    return { error: "Kata sandi belum diatur untuk akun ini. Hubungi administrator." };
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return { error: "Email atau kata sandi tidak valid." };
  }

  await setCurrentUser(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearCurrentUser();
  redirect("/login");
}

export async function changePasswordAction(formData: FormData): Promise<{ success?: boolean; error?: string; message?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { error: "Sesi Anda telah berakhir. Silakan login kembali." };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Semua kolom kata sandi wajib diisi." };
  }

  if (newPassword.length < 6) {
    return { error: "Kata sandi baru minimal harus 6 karakter." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Konfirmasi kata sandi baru tidak cocok." };
  }

  if (currentPassword === newPassword) {
    return { error: "Kata sandi baru harus berbeda dari kata sandi saat ini." };
  }

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
  });

  if (!user || !user.active) {
    return { error: "Pengguna tidak ditemukan atau tidak aktif." };
  }

  if (user.passwordHash) {
    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return { error: "Kata sandi saat ini tidak tepat." };
    }
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  return { success: true, message: "Kata sandi berhasil diperbarui!" };
}
