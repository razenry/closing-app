import { prisma } from "@/lib/db/prisma";
import { Role } from "@prisma/client";
import { hashPassword } from "@/lib/security/password";

export class AdminService {
  /**
   * ==========================================
   * 1. MASTER BRANCH MANAGEMENT
   * ==========================================
   */

  static async listBranchesWithStats() {
    return prisma.branch.findMany({
      include: {
        _count: {
          select: {
            users: true,
            closings: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  static async createBranch(params: { name: string; code: string }) {
    const cleanName = params.name.trim();
    const cleanCode = params.code.trim().toUpperCase();

    if (!cleanName || cleanName.length < 2) {
      throw new Error("Nama cabang wajib diisi (minimal 2 karakter).");
    }
    if (!cleanCode || cleanCode.length < 2) {
      throw new Error("Kode cabang wajib diisi (minimal 2 karakter).");
    }

    const existing = await prisma.branch.findUnique({
      where: { code: cleanCode },
    });
    if (existing) {
      throw new Error(`Kode cabang '${cleanCode}' sudah digunakan oleh ${existing.name}.`);
    }

    return prisma.branch.create({
      data: {
        name: cleanName,
        code: cleanCode,
        active: true,
      },
    });
  }

  static async updateBranch(
    id: string,
    params: { name: string; code: string; active?: boolean }
  ) {
    const cleanName = params.name.trim();
    const cleanCode = params.code.trim().toUpperCase();

    if (!cleanName || cleanName.length < 2) {
      throw new Error("Nama cabang wajib diisi (minimal 2 karakter).");
    }
    if (!cleanCode || cleanCode.length < 2) {
      throw new Error("Kode cabang wajib diisi (minimal 2 karakter).");
    }

    const existing = await prisma.branch.findUnique({
      where: { code: cleanCode },
    });
    if (existing && existing.id !== id) {
      throw new Error(`Kode cabang '${cleanCode}' sudah digunakan oleh cabang lain.`);
    }

    return prisma.branch.update({
      where: { id },
      data: {
        name: cleanName,
        code: cleanCode,
        ...(params.active !== undefined ? { active: params.active } : {}),
      },
    });
  }

  static async toggleBranchActive(id: string, active: boolean) {
    return prisma.branch.update({
      where: { id },
      data: { active },
    });
  }

  /**
   * ==========================================
   * 2. MASTER USER & ACCOUNT MANAGEMENT
   * ==========================================
   */

  static async listUsersWithRelations() {
    return prisma.user.findMany({
      include: {
        branch: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: {
            closings: true,
            verifiedClosings: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createUser(params: {
    name: string;
    email: string;
    role: Role;
    branchId?: string | null;
    authorizedBranchIds?: string | null;
    password: string;
  }) {
    const cleanName = params.name.trim();
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanPassword = params.password.trim();

    if (!cleanName || cleanName.length < 2) {
      throw new Error("Nama lengkap wajib diisi.");
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new Error("Alamat email tidak valid.");
    }
    if (!cleanPassword || cleanPassword.length < 6) {
      throw new Error("Kata sandi minimal 6 karakter.");
    }

    if (params.role === Role.STAFF_CABANG && !params.branchId) {
      throw new Error("Staff Cabang wajib ditetapkan ke salah satu cabang.");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existingUser) {
      throw new Error(`Email '${cleanEmail}' sudah terdaftar dalam sistem.`);
    }

    const passwordHash = await hashPassword(cleanPassword);

    return prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        role: params.role,
        branchId: params.role === Role.STAFF_CABANG ? params.branchId : null,
        authorizedBranchIds:
          params.role === Role.STAFF_PUSAT ? params.authorizedBranchIds : null,
        passwordHash,
        active: true,
      },
    });
  }

  static async updateUser(
    userId: string,
    params: {
      name: string;
      role: Role;
      branchId?: string | null;
      authorizedBranchIds?: string | null;
      active?: boolean;
    }
  ) {
    const cleanName = params.name.trim();
    if (!cleanName || cleanName.length < 2) {
      throw new Error("Nama lengkap wajib diisi.");
    }

    if (params.role === Role.STAFF_CABANG && !params.branchId) {
      throw new Error("Staff Cabang wajib ditetapkan ke salah satu cabang.");
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        name: cleanName,
        role: params.role,
        branchId: params.role === Role.STAFF_CABANG ? params.branchId : null,
        authorizedBranchIds:
          params.role === Role.STAFF_PUSAT ? params.authorizedBranchIds : null,
        ...(params.active !== undefined ? { active: params.active } : {}),
      },
    });
  }

  static async resetUserPassword(userId: string, newPassword: string) {
    const cleanPassword = newPassword.trim();
    if (!cleanPassword || cleanPassword.length < 6) {
      throw new Error("Kata sandi baru minimal 6 karakter.");
    }

    const passwordHash = await hashPassword(cleanPassword);

    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  static async toggleUserActive(userId: string, active: boolean) {
    return prisma.user.update({
      where: { id: userId },
      data: { active },
    });
  }
}
