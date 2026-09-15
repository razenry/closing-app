import { prisma } from "@/lib/db/prisma";
import { StockStatus } from "@prisma/client";

export class ChecklistRepository {
  static async findByClosingId(closingId: string) {
    return prisma.closingChecklist.findMany({
      where: { closingId },
      orderBy: { createdAt: "asc" },
    });
  }

  static async findByClosingAndGramasi(closingId: string, gramasi: string) {
    return prisma.closingChecklist.findUnique({
      where: {
        closingId_gramasi: {
          closingId,
          gramasi,
        },
      },
    });
  }

  static async initializeItems(closingId: string, items: { gramasi: string; stockStatus: StockStatus; completed: boolean }[]) {
    return prisma.closingChecklist.createMany({
      data: items.map((item) => ({
        closingId,
        gramasi: item.gramasi,
        stockStatus: item.stockStatus,
        completed: item.completed,
      })),
      skipDuplicates: true,
    });
  }

  static async updateStatus(closingId: string, gramasi: string, stockStatus: StockStatus, completed: boolean, notes?: string) {
    return prisma.closingChecklist.upsert({
      where: {
        closingId_gramasi: {
          closingId,
          gramasi,
        },
      },
      update: {
        stockStatus,
        completed,
        notes,
      },
      create: {
        closingId,
        gramasi,
        stockStatus,
        completed,
        notes,
      },
    });
  }

  static async updateCompleted(id: string, completed: boolean) {
    return prisma.closingChecklist.update({
      where: { id },
      data: { completed },
    });
  }
}
