import { prisma } from "@/lib/db/prisma";

export class BranchRepository {
  static async findById(id: string) {
    return prisma.branch.findUnique({
      where: { id },
    });
  }

  static async findByCode(code: string) {
    return prisma.branch.findUnique({
      where: { code },
    });
  }

  static async listAll() {
    return prisma.branch.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
  }

  static async listByIds(ids: string[]) {
    return prisma.branch.findMany({
      where: {
        id: { in: ids },
        active: true,
      },
      orderBy: { name: "asc" },
    });
  }
}
