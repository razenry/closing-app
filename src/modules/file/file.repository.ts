import { prisma } from "@/lib/db/prisma";
import { FileCategory } from "@prisma/client";

export class FileRepository {
  static async findById(id: string) {
    return prisma.file.findUnique({
      where: { id },
      include: {
        closing: {
          include: {
            branch: true,
          },
        },
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  static async findByClosingId(closingId: string) {
    return prisma.file.findMany({
      where: { closingId },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { uploadedAt: "desc" },
    });
  }

  static async create(data: {
    closingId: string;
    category: FileCategory;
    gramasi?: string | null;
    originalFilename: string;
    storageFilename: string;
    mimeType: string;
    size: number;
    uploadedById: string;
    revisionId?: string | null;
  }) {
    return prisma.file.create({
      data: {
        closingId: data.closingId,
        category: data.category,
        gramasi: data.gramasi,
        originalFilename: data.originalFilename,
        storageFilename: data.storageFilename,
        mimeType: data.mimeType,
        size: data.size,
        uploadedById: data.uploadedById,
        revisionId: data.revisionId,
      },
    });
  }

  static async delete(id: string) {
    return prisma.file.delete({
      where: { id },
    });
  }
}
