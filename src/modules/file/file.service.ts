import { FileRepository } from "./file.repository";
import { validateFileSecurity } from "./file.validation";
import { storageService } from "@/lib/storage";
import { ChecklistService } from "../checklist/checklist.service";
import { ChecklistRepository } from "../checklist/checklist.repository";
import { ActivityService } from "../activity/activity.service";
import { AuthUser, PermissionService } from "@/lib/permissions";
import { ClosingStatus, FileCategory, StockStatus, ActivityAction } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import archiver from "archiver";
import { PassThrough } from "stream";

export class FileService {
  /**
   * Upload file with full validation, storage abstraction, checklist sync, and audit logging.
   */
  static async uploadFile(params: {
    user: AuthUser;
    closingId: string;
    category: FileCategory;
    gramasi?: string | null;
    originalFilename: string;
    mimeType: string;
    buffer: Buffer;
  }) {
    const { user, closingId, category, gramasi, originalFilename, mimeType, buffer } = params;

    // 1. Fetch closing to check authorization and state
    const closing = await prisma.closing.findUnique({
      where: { id: closingId },
      include: { branch: true },
    });

    if (!closing) {
      throw new Error("Closing not found");
    }

    // 2. Authorization check
    if (!PermissionService.canUploadFile(user, closing)) {
      throw new Error("Anda tidak memiliki izin untuk mengunggah file pada closing ini.");
    }

    // 3. Status check (BR-007)
    if (closing.status === ClosingStatus.VERIFIED) {
      throw new Error("Closing ini sudah diverifikasi dan tidak dapat diubah.");
    }
    if (closing.status === ClosingStatus.SUBMITTED) {
      throw new Error("Closing sedang dalam status review, tidak dapat mengunggah file.");
    }

    // 4. File security & size validation
    validateFileSecurity(originalFilename, mimeType, buffer.length);

    // 5. If category is STOCK_PHOTO, gramasi is required
    if (category === FileCategory.STOCK_PHOTO && !gramasi) {
      throw new Error("Foto stok wajib memiliki informasi gramasi.");
    }

    // 6. Save file using storageService abstraction (private storage)
    const uploadResult = await storageService.upload({
      buffer,
      originalFilename,
      mimeType,
    });

    // 7. Check if there's an active revision
    const latestRevision = await prisma.closingRevision.findFirst({
      where: { closingId },
      orderBy: { revisionNumber: "desc" },
    });

    // 8. Create file record in database
    const file = await FileRepository.create({
      closingId,
      category,
      gramasi: gramasi || null,
      originalFilename,
      storageFilename: uploadResult.storageFilename,
      mimeType,
      size: uploadResult.size,
      uploadedById: user.id,
      revisionId: latestRevision?.id || null,
    });

    // 9. If gramasi photo, ensure checklist status is set to HAS_STOCK if it was NOT_SET
    if (category === FileCategory.STOCK_PHOTO && gramasi) {
      const existingChecklist = await ChecklistRepository.findByClosingAndGramasi(closingId, gramasi);
      if (!existingChecklist || existingChecklist.stockStatus === StockStatus.NOT_SET) {
        await ChecklistRepository.updateStatus(closingId, gramasi, StockStatus.HAS_STOCK, true);
      }
    }

    // 10. Recalculate completeness
    await ChecklistService.syncCompleteness(closingId);

    // 11. Record activity log
    await ActivityService.log({
      actorId: user.id,
      closingId,
      action: ActivityAction.UPLOAD_FILE,
      description: `Mengunggah file ${originalFilename} (${category}${gramasi ? ` - ${gramasi}` : ""})`,
      metadata: {
        fileId: file.id,
        category,
        gramasi,
        filename: originalFilename,
        size: uploadResult.size,
      },
    });

    return file;
  }

  /**
   * Delete file, re-sync completeness, and log activity.
   */
  static async deleteFile(user: AuthUser, fileId: string) {
    const file = await FileRepository.findById(fileId);
    if (!file) {
      throw new Error("File not found");
    }

    if (!PermissionService.canEditClosing(user, file.closing)) {
      throw new Error("Anda tidak memiliki izin untuk menghapus file ini.");
    }

    if (file.closing.status === ClosingStatus.VERIFIED) {
      throw new Error("Closing sudah diverifikasi, file tidak dapat dihapus.");
    }

    // Delete from storage
    await storageService.delete(file.storageFilename);

    // Delete record from database
    await FileRepository.delete(file.id);

    // Re-sync completeness
    await ChecklistService.syncCompleteness(file.closingId);

    // Log activity
    await ActivityService.log({
      actorId: user.id,
      closingId: file.closingId,
      action: ActivityAction.DELETE_FILE,
      description: `Menghapus file ${file.originalFilename}`,
      metadata: {
        fileId: file.id,
        filename: file.originalFilename,
        category: file.category,
      },
    });

    return true;
  }

  /**
   * Secure download of an individual file.
   */
  static async downloadFile(fileId: string, user?: AuthUser | null, hasShareAccess?: boolean) {
    const file = await FileRepository.findById(fileId);
    if (!file) {
      throw new Error("File tidak ditemukan");
    }

    // Authorization: either authenticated user with branch access OR valid guest share token
    if (!hasShareAccess) {
      if (!user) {
        throw new Error("Autentikasi diperlukan untuk mengunduh file ini.");
      }
      if (!PermissionService.canDownloadFile(user, file.closing.branchId)) {
        throw new Error("Anda tidak memiliki izin untuk mengunduh file dari cabang ini.");
      }
    }

    const download = await storageService.download(file.storageFilename, file.originalFilename);

    if (user) {
      await ActivityService.log({
        actorId: user.id,
        closingId: file.closingId,
        action: ActivityAction.DOWNLOAD_FILE,
        description: `Mengunduh file ${file.originalFilename}`,
        metadata: { fileId: file.id, filename: file.originalFilename },
      });
    }

    return {
      file,
      ...download,
    };
  }

  /**
   * Generates a streaming ZIP archive of all files for a closing.
   * Format: closing-{branch}-{date}.zip
   * Directory structure:
   * closing-{branch}-{date}/
   * ├── stock/
   * ├── stock-excel/
   * └── recap/
   */
  static async createZipArchive(closingId: string, user?: AuthUser | null, hasShareAccess?: boolean) {
    const closing = await prisma.closing.findUnique({
      where: { id: closingId },
      include: {
        branch: true,
        files: true,
      },
    });

    if (!closing) {
      throw new Error("Closing tidak ditemukan");
    }

    if (!hasShareAccess) {
      if (!user) {
        throw new Error("Autentikasi diperlukan.");
      }
      if (!PermissionService.canDownloadFile(user, closing.branchId)) {
        throw new Error("Anda tidak memiliki izin mengunduh dokumen closing ini.");
      }
    }

    const branchSlug = closing.branch.code.toLowerCase();
    const dateStr = closing.closingDate.toISOString().split("T")[0];
    const zipFilename = `closing-${branchSlug}-${dateStr}.zip`;
    const rootFolder = `closing-${branchSlug}-${dateStr}`;

    const archive = archiver("zip", { zlib: { level: 9 } });
    const passThrough = new PassThrough();

    archive.pipe(passThrough);

    for (const file of closing.files) {
      try {
        const fileData = await storageService.download(file.storageFilename, file.originalFilename);
        let subfolder = "other";
        if (file.category === FileCategory.STOCK_PHOTO) {
          subfolder = "stock";
        } else if (file.category === FileCategory.STOCK_EXCEL) {
          subfolder = "stock-excel";
        } else if (file.category === FileCategory.RECAP_PHOTO) {
          subfolder = "recap";
        }

        const entryName = `${rootFolder}/${subfolder}/${file.originalFilename}`;
        archive.append(fileData.stream as any, { name: entryName });
      } catch (err) {
        console.error(`Error adding ${file.storageFilename} to zip:`, err);
      }
    }

    archive.finalize();

    if (user) {
      await ActivityService.log({
        actorId: user.id,
        closingId: closing.id,
        action: ActivityAction.DOWNLOAD_ALL,
        description: `Mengunduh seluruh dokumentasi sebagai ZIP: ${zipFilename}`,
        metadata: { zipFilename, fileCount: closing.files.length },
      });
    }

    return {
      stream: passThrough,
      zipFilename,
    };
  }
}
