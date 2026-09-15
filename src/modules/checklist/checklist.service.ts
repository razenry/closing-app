import { ChecklistRepository } from "./checklist.repository";
import {
  ALL_CHECKLIST_ITEMS,
  CHECKLIST_ITEM_LABELS,
  ChecklistItemType,
  GRAMMASI_LIST,
} from "./checklist.validation";
import { StockStatus, FileCategory } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export interface ItemEvaluation {
  isComplete: boolean;
  missingName?: string;
}

export interface CompletenessReport {
  completedCount: number;
  totalCount: number;
  percentage: number;
  missingItems: string[];
  isComplete: boolean;
}

export class ChecklistService {
  /**
   * Initializes all 11 checklist items for a new closing.
   */
  static async initializeChecklistForClosing(closingId: string) {
    const items = ALL_CHECKLIST_ITEMS.map((gramasi) => ({
      gramasi,
      stockStatus: StockStatus.NOT_SET,
      completed: false,
    }));
    return ChecklistRepository.initializeItems(closingId, items);
  }

  /**
   * Evaluates completion of a single checklist item based on business rules.
   * BR-002: HAS_STOCK requires photo.
   * BR-003: NO_STOCK does not require photo (complete).
   */
  static evaluateItem(
    gramasi: string,
    stockStatus: StockStatus,
    files: Array<{ category: FileCategory; gramasi: string | null }>
  ): ItemEvaluation {
    const isGramasi = (GRAMMASI_LIST as readonly string[]).includes(gramasi);

    if (isGramasi) {
      if (stockStatus === StockStatus.NO_STOCK) {
        // BR-003: NO_STOCK does not require photo, counts as complete.
        return { isComplete: true };
      }

      if (stockStatus === StockStatus.HAS_STOCK) {
        // BR-002: HAS_STOCK requires photo.
        const hasPhoto = files.some(
          (f) => f.category === FileCategory.STOCK_PHOTO && f.gramasi === gramasi
        );
        if (hasPhoto) {
          return { isComplete: true };
        }
        return {
          isComplete: false,
          missingName: CHECKLIST_ITEM_LABELS[gramasi as ChecklistItemType] ?? `Foto Stok ${gramasi}`,
        };
      }

      // NOT_SET
      return {
        isComplete: false,
        missingName: `Status Stok ${gramasi} Belum Diatur`,
      };
    }

    if (gramasi === "stock_excel") {
      const hasExcel = files.some((f) => f.category === FileCategory.STOCK_EXCEL);
      return {
        isComplete: hasExcel,
        missingName: hasExcel ? undefined : "Stock Excel",
      };
    }

    if (gramasi === "recap_photo") {
      const hasRecap = files.some((f) => f.category === FileCategory.RECAP_PHOTO);
      return {
        isComplete: hasRecap,
        missingName: hasRecap ? undefined : "Recap Photo",
      };
    }

    return { isComplete: false };
  }

  /**
   * Pure function to calculate completeness across 11 items.
   */
  static calculateCompleteness(
    checklists: Array<{ gramasi: string; stockStatus: StockStatus }>,
    files: Array<{ category: FileCategory; gramasi: string | null }>
  ): CompletenessReport {
    const totalCount = 11;
    let completedCount = 0;
    const missingItems: string[] = [];

    for (const itemKey of ALL_CHECKLIST_ITEMS) {
      const item = checklists.find((c) => c.gramasi === itemKey);
      const status = item?.stockStatus ?? StockStatus.NOT_SET;

      const evalResult = this.evaluateItem(itemKey, status, files);
      if (evalResult.isComplete) {
        completedCount++;
      } else if (evalResult.missingName) {
        missingItems.push(evalResult.missingName);
      }
    }

    // Formula: completed_items / 11 * 100
    const raw = (completedCount / totalCount) * 100;
    const percentage = Math.round(raw * 10) / 10;

    return {
      completedCount,
      totalCount,
      percentage,
      missingItems,
      isComplete: completedCount === totalCount,
    };
  }

  /**
   * Syncs and persists completeness for a closing in PostgreSQL.
   */
  static async syncCompleteness(closingId: string): Promise<CompletenessReport> {
    const checklists = await ChecklistRepository.findByClosingId(closingId);
    const files = await prisma.file.findMany({
      where: { closingId },
      select: { category: true, gramasi: true },
    });

    // Update completed flag in database for each checklist item
    for (const item of checklists) {
      const evalResult = this.evaluateItem(item.gramasi, item.stockStatus, files);
      if (item.completed !== evalResult.isComplete) {
        await ChecklistRepository.updateCompleted(item.id, evalResult.isComplete);
      }
    }

    const report = this.calculateCompleteness(checklists, files);

    await prisma.closing.update({
      where: { id: closingId },
      data: { completenessPercentage: report.percentage },
    });

    return report;
  }
}
