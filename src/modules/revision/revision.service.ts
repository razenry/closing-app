import { RevisionRepository } from "./revision.repository";
import { AuthUser, PermissionService } from "@/lib/permissions";
import { ClosingStatus, ActivityAction } from "@prisma/client";
import { ActivityService } from "../activity/activity.service";
import { NotificationService } from "../notification/notification.service";
import { prisma } from "@/lib/db/prisma";

export class RevisionService {
  /**
   * HQ requests/assigns revision on an active closing with a mandatory note.
   * State transition: DRAFT / SUBMITTED -> REVISION_REQUIRED
   */
  static async requestRevision(params: {
    user: AuthUser;
    closingId: string;
    note: string;
  }) {
    const { user, closingId, note } = params;

    const cleanNote = note.trim();
    if (!cleanNote || cleanNote.length < 3) {
      throw new Error("Catatan revisi wajib diisi (minimal 3 karakter).");
    }

    const closing = await prisma.closing.findUnique({
      where: { id: closingId },
      include: { branch: true },
    });

    if (!closing) {
      throw new Error("Closing tidak ditemukan.");
    }

    if (!PermissionService.canRequestRevision(user, closing)) {
      throw new Error("Anda tidak memiliki izin untuk meminta revisi pada closing ini.");
    }

    if (closing.status === ClosingStatus.VERIFIED) {
      throw new Error("Closing yang sudah berstatus VERIFIED tidak dapat direvisi.");
    }

    // Atomic transaction: create revision and update closing status
    const [revision] = await prisma.$transaction([
      prisma.closingRevision.create({
        data: {
          closingId,
          revisionNumber: await RevisionRepository.getNextRevisionNumber(closingId),
          requestedById: user.id,
          note: cleanNote,
        },
        include: {
          requestedBy: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      prisma.closing.update({
        where: { id: closingId },
        data: { status: ClosingStatus.REVISION_REQUIRED },
      }),
    ]);

    // Log activity
    await ActivityService.log({
      actorId: user.id,
      closingId,
      action: ActivityAction.REQUEST_REVISION,
      description: `Staff Pusat meminta revisi: "${cleanNote}"`,
      metadata: {
        revisionId: revision.id,
        revisionNumber: revision.revisionNumber,
        note: cleanNote,
      },
    });

    // Notify branch staff about the requested revision
    await NotificationService.notifyBranchStaff(closing.branchId, {
      title: `Permintaan Revisi Closing - ${closing.branch.name}`,
      message: `${user.name} (Kantor Pusat) meminta revisi: "${cleanNote}"`,
      link: `/closings/${closingId}`,
    });

    return revision;
  }

  /**
   * Branch staff begins fixing documentation: transitions REVISION_REQUIRED -> DRAFT.
   */
  static async startFixingRevision(user: AuthUser, closingId: string) {
    const closing = await prisma.closing.findUnique({
      where: { id: closingId },
      include: { branch: true },
    });

    if (!closing) {
      throw new Error("Closing tidak ditemukan.");
    }

    if (!PermissionService.canEditClosing(user, closing)) {
      throw new Error("Anda tidak memiliki hak untuk memperbaiki closing ini.");
    }

    if (closing.status !== ClosingStatus.REVISION_REQUIRED) {
      throw new Error("Closing tidak dalam status perbaikan revisi.");
    }

    await prisma.$transaction([
      prisma.closing.update({
        where: { id: closingId },
        data: { status: ClosingStatus.DRAFT },
      }),
      prisma.closingRevision.updateMany({
        where: { closingId, resolvedById: null },
        data: {
          resolvedById: user.id,
          resolvedAt: new Date(),
        },
      }),
    ]);

    await ActivityService.log({
      actorId: user.id,
      closingId,
      action: ActivityAction.UPLOAD_REVISION,
      description: "Staff Cabang mulai melakukan perbaikan dokumentasi revisi.",
    });

    // Notify Pusat staff that branch is addressing revision
    await NotificationService.notifyPusatStaff({
      title: `Perbaikan Revisi Dimulai: ${closing.branch.name}`,
      message: `${user.name} (Staff Cabang) mulai melakukan perbaikan dokumen closing.`,
      link: `/closings/${closingId}`,
      branchId: closing.branchId,
    });

    return true;
  }

  static async getRevisions(closingId: string) {
    return RevisionRepository.listByClosingId(closingId);
  }
}
