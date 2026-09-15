import { ClosingRepository } from "./closing.repository";
import { ChecklistService } from "../checklist/checklist.service";
import { ActivityService } from "../activity/activity.service";
import { AuthUser, PermissionService } from "@/lib/permissions";
import { ClosingStatus, ActivityAction } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export class ClosingService {
  /**
   * BR-001: One Closing Per Branch Per Day
   * Staff Cabang creates closing for their branch on a given date.
   */
  static async createClosing(params: {
    user: AuthUser;
    branchId: string;
    closingDateString: string; // YYYY-MM-DD
    notes?: string;
  }) {
    const { user, branchId, closingDateString, notes } = params;

    // 1. Authorization check
    if (!PermissionService.canAccessBranch(user, branchId)) {
      throw new Error("Anda tidak memiliki akses untuk membuat closing pada cabang ini.");
    }

    const dateOnly = new Date(closingDateString);
    if (isNaN(dateOnly.getTime())) {
      throw new Error("Format tanggal closing tidak valid.");
    }

    // 2. BR-001 check: verify uniqueness
    const existing = await ClosingRepository.findByBranchAndDate(branchId, dateOnly);
    if (existing) {
      throw new Error("A closing already exists for this date. (Closing sudah ada untuk cabang dan tanggal ini)");
    }

    // 3. Create closing record
    const closing = await ClosingRepository.create({
      branchId,
      closingDate: dateOnly,
      createdById: user.id,
      notes,
      status: ClosingStatus.DRAFT,
    });

    // 4. Initialize all 11 checklist items
    await ChecklistService.initializeChecklistForClosing(closing.id);

    // 5. Initial completeness check
    await ChecklistService.syncCompleteness(closing.id);

    // 6. Log activity
    await ActivityService.log({
      actorId: user.id,
      closingId: closing.id,
      action: ActivityAction.CREATE_CLOSING,
      description: `Membuat draft closing tanggal ${closingDateString}`,
      metadata: { branchId, closingDate: closingDateString },
    });

    return closing;
  }

  /**
   * Submits a closing to HQ.
   * Enforces server-side completeness validation.
   */
  static async submitClosing(user: AuthUser, closingId: string) {
    const closing = await ClosingRepository.findByIdWithAllRelations(closingId);
    if (!closing) {
      throw new Error("Closing tidak ditemukan.");
    }

    if (!PermissionService.canAccessBranch(user, closing.branchId)) {
      throw new Error("Anda tidak memiliki akses ke closing ini.");
    }

    // Re-verify completeness directly on server
    const report = await ChecklistService.syncCompleteness(closingId);

    if (!report.isComplete) {
      const missingList = report.missingItems.length > 0 ? `\nMissing:\n- ${report.missingItems.join("\n- ")}` : "";
      throw new Error(`Closing is incomplete (${report.completedCount}/11 - ${report.percentage}%).${missingList}`);
    }

    if (closing.status !== ClosingStatus.DRAFT && closing.status !== ClosingStatus.REVISION_REQUIRED) {
      throw new Error(`Closing dengan status ${closing.status} tidak dapat disubmit.`);
    }

    const updated = await ClosingRepository.markSubmitted(closingId);

    await ActivityService.log({
      actorId: user.id,
      closingId,
      action: ActivityAction.SUBMIT_CLOSING,
      description: "Menyerahkan dokumentasi closing ke Kantor Pusat (11/11 100% Lengkap).",
      metadata: { completeness: report.percentage },
    });

    return updated;
  }

  /**
   * HQ verifies a valid submitted closing.
   * State transition: SUBMITTED -> VERIFIED.
   * BR-007: VERIFIED closing becomes immutable.
   */
  static async verifyClosing(user: AuthUser, closingId: string) {
    const closing = await ClosingRepository.findByIdWithAllRelations(closingId);
    if (!closing) {
      throw new Error("Closing tidak ditemukan.");
    }

    if (!PermissionService.canVerifyClosing(user, closing)) {
      throw new Error("Anda tidak memiliki izin untuk memverifikasi closing ini.");
    }

    if (closing.status !== ClosingStatus.SUBMITTED) {
      throw new Error("Hanya closing berstatus SUBMITTED yang dapat diverifikasi.");
    }

    const report = await ChecklistService.syncCompleteness(closingId);
    if (!report.isComplete) {
      throw new Error("Closing belum lengkap 100%, tidak dapat diverifikasi.");
    }

    const verified = await ClosingRepository.markVerified(closingId, user.id);

    await ActivityService.log({
      actorId: user.id,
      closingId,
      action: ActivityAction.VERIFY_CLOSING,
      description: `Kantor Pusat memverifikasi closing cabang ${closing.branch.name}`,
      metadata: { verifiedById: user.id },
    });

    return verified;
  }

  /**
   * Get single closing with all relations, verifying authorization.
   */
  static async getClosingDetail(user: AuthUser, closingId: string) {
    const closing = await ClosingRepository.findByIdWithAllRelations(closingId);
    if (!closing) {
      return null;
    }

    if (!PermissionService.canViewClosing(user, closing)) {
      throw new Error("Anda tidak memiliki izin untuk mengakses closing cabang ini.");
    }

    return closing;
  }

  /**
   * List closings filtered by user scope, status, dates, and pagination.
   */
  static async listClosings(params: {
    user: AuthUser;
    branchId?: string;
    status?: ClosingStatus | "ALL";
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { user, branchId, status, startDate, endDate, page = 1, pageSize = 10 } = params;

    const authorizedBranchIds = PermissionService.getAuthorizedBranches(user);

    let targetBranchIds = authorizedBranchIds;
    if (branchId && branchId !== "ALL") {
      if (!authorizedBranchIds.includes(branchId)) {
        throw new Error("Anda tidak memiliki izin untuk cabang yang dipilih.");
      }
      targetBranchIds = [branchId];
    }

    const skip = (page - 1) * pageSize;
    const filterStatus = status && status !== "ALL" ? status : undefined;
    const parsedStart = startDate ? new Date(startDate) : undefined;
    const parsedEnd = endDate ? new Date(endDate) : undefined;

    return ClosingRepository.listFiltered({
      branchIds: targetBranchIds,
      status: filterStatus,
      startDate: parsedStart,
      endDate: parsedEnd,
      skip,
      take: pageSize,
    });
  }

  /**
   * Staff Cabang Dashboard data: Today's Closing & History.
   */
  static async getDashboardForStaffCabang(user: AuthUser, todayDateStr: string) {
    const branchId = user.branchId;
    if (!branchId) {
      return { todayClosing: null, recentClosings: [] };
    }

    const today = new Date(todayDateStr);
    const todayClosing = await ClosingRepository.findByBranchAndDate(branchId, today);

    let todayDetail = null;
    if (todayClosing) {
      todayDetail = await ClosingRepository.findByIdWithAllRelations(todayClosing.id);
    }

    const { items: recentClosings } = await ClosingRepository.listFiltered({
      branchIds: [branchId],
      take: 5,
    });

    return {
      todayClosing: todayDetail,
      recentClosings,
    };
  }

  /**
   * Staff Pusat Dashboard data: Stats cards & "Need Attention" table.
   */
  static async getDashboardForStaffPusat(user: AuthUser) {
    const authorizedBranches = PermissionService.getAuthorizedBranches(user);
    if (authorizedBranches.length === 0) {
      return {
        stats: { total: 0, verified: 0, submitted: 0, revisionRequired: 0, averageCompleteness: 0 },
        needAttention: [],
      };
    }

    const [stats, needAttention] = await Promise.all([
      ClosingRepository.getStats(authorizedBranches),
      ClosingRepository.listNeedAttention(authorizedBranches),
    ]);

    return {
      stats,
      needAttention,
    };
  }
}
