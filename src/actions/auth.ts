"use server";

import { setCurrentUser, clearCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/security/password";
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
