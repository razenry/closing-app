import { prisma } from "@/lib/db/prisma";

export class ShareRepository {
  static async create(data: {
    closingId: string;
    tokenHash: string;
    expiresAt: Date;
    createdById: string;
  }) {
    return prisma.shareLink.create({
      data: {
        closingId: data.closingId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        createdById: data.createdById,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  static async findByTokenHash(tokenHash: string) {
    return prisma.shareLink.findUnique({
      where: { tokenHash },
      include: {
        closing: {
          include: {
            branch: true,
            createdBy: {
              select: { id: true, name: true, email: true },
            },
            verifiedBy: {
              select: { id: true, name: true, email: true },
            },
            checklists: {
              orderBy: { createdAt: "asc" },
            },
            files: {
              orderBy: { uploadedAt: "desc" },
            },
          },
        },
      },
    });
  }

  static async listByClosingId(closingId: string) {
    return prisma.shareLink.findMany({
      where: { closingId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async revoke(id: string) {
    return prisma.shareLink.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }
}
