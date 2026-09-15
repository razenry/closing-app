import { prisma } from "@/lib/db/prisma";

export class RevisionRepository {
  static async listByClosingId(closingId: string) {
    return prisma.closingRevision.findMany({
      where: { closingId },
      include: {
        requestedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        resolvedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { revisionNumber: "asc" },
    });
  }

  static async getNextRevisionNumber(closingId: string): Promise<number> {
    const latest = await prisma.closingRevision.findFirst({
      where: { closingId },
      orderBy: { revisionNumber: "desc" },
      select: { revisionNumber: true },
    });
    return (latest?.revisionNumber ?? 0) + 1;
  }

  static async create(data: {
    closingId: string;
    requestedById: string;
    note: string;
  }) {
    const revisionNumber = await this.getNextRevisionNumber(data.closingId);
    return prisma.closingRevision.create({
      data: {
        closingId: data.closingId,
        revisionNumber,
        requestedById: data.requestedById,
        note: data.note,
      },
      include: {
        requestedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }

  static async markResolved(closingId: string, resolvedById: string) {
    const latest = await prisma.closingRevision.findFirst({
      where: { closingId, resolvedById: null },
      orderBy: { revisionNumber: "desc" },
    });

    if (latest) {
      return prisma.closingRevision.update({
        where: { id: latest.id },
        data: {
          resolvedById,
          resolvedAt: new Date(),
        },
      });
    }
    return null;
  }
}
