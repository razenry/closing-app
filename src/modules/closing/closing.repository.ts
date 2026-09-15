import { prisma } from "@/lib/db/prisma";
import { ClosingStatus, Prisma } from "@prisma/client";

export class ClosingRepository {
  static async findByIdWithAllRelations(id: string) {
    return prisma.closing.findUnique({
      where: { id },
      include: {
        branch: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        verifiedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        checklists: {
          orderBy: { createdAt: "asc" },
        },
        files: {
          include: {
            uploadedBy: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { uploadedAt: "desc" },
        },
        revisions: {
          include: {
            requestedBy: {
              select: { id: true, name: true, email: true, role: true },
            },
            resolvedBy: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
          orderBy: { revisionNumber: "asc" },
        },
        shareLinks: {
          include: {
            createdBy: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        activityLogs: {
          include: {
            actor: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  static async findByBranchAndDate(branchId: string, closingDate: Date) {
    return prisma.closing.findUnique({
      where: {
        branchId_closingDate: {
          branchId,
          closingDate,
        },
      },
    });
  }

  static async create(data: {
    branchId: string;
    closingDate: Date;
    createdById: string;
    notes?: string;
    status?: ClosingStatus;
  }) {
    return prisma.closing.create({
      data: {
        branchId: data.branchId,
        closingDate: data.closingDate,
        createdById: data.createdById,
        notes: data.notes,
        status: data.status || ClosingStatus.DRAFT,
      },
    });
  }

  static async updateStatus(id: string, status: ClosingStatus) {
    return prisma.closing.update({
      where: { id },
      data: { status },
    });
  }

  static async markSubmitted(id: string) {
    return prisma.closing.update({
      where: { id },
      data: {
        status: ClosingStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });
  }

  static async markVerified(id: string, verifiedById: string) {
    return prisma.closing.update({
      where: { id },
      data: {
        status: ClosingStatus.VERIFIED,
        verifiedAt: new Date(),
        verifiedById,
      },
    });
  }

  static async listFiltered(options: {
    branchIds: string[];
    status?: ClosingStatus;
    startDate?: Date;
    endDate?: Date;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.ClosingWhereInput = {
      branchId: { in: options.branchIds },
    };

    if (options.status) {
      where.status = options.status;
    }

    if (options.startDate || options.endDate) {
      where.closingDate = {};
      if (options.startDate) {
        where.closingDate.gte = options.startDate;
      }
      if (options.endDate) {
        where.closingDate.lte = options.endDate;
      }
    }

    const [items, total] = await Promise.all([
      prisma.closing.findMany({
        where,
        include: {
          branch: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          verifiedBy: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { files: true, checklists: true, revisions: true },
          },
        },
        orderBy: { closingDate: "desc" },
        skip: options.skip,
        take: options.take,
      }),
      prisma.closing.count({ where }),
    ]);

    return { items, total };
  }

  static async getStats(branchIds: string[]) {
    const [total, verified, submitted, revisionRequired, avgResult] = await Promise.all([
      prisma.closing.count({ where: { branchId: { in: branchIds } } }),
      prisma.closing.count({ where: { branchId: { in: branchIds }, status: ClosingStatus.VERIFIED } }),
      prisma.closing.count({ where: { branchId: { in: branchIds }, status: ClosingStatus.SUBMITTED } }),
      prisma.closing.count({ where: { branchId: { in: branchIds }, status: ClosingStatus.REVISION_REQUIRED } }),
      prisma.closing.aggregate({
        where: { branchId: { in: branchIds } },
        _avg: { completenessPercentage: true },
      }),
    ]);

    return {
      total,
      verified,
      submitted,
      revisionRequired,
      averageCompleteness: Math.round((avgResult._avg.completenessPercentage ?? 0) * 10) / 10,
    };
  }

  static async listNeedAttention(branchIds: string[]) {
    return prisma.closing.findMany({
      where: {
        branchId: { in: branchIds },
        status: { in: [ClosingStatus.SUBMITTED, ClosingStatus.REVISION_REQUIRED] },
      },
      include: {
        branch: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { closingDate: "desc" },
      take: 10,
    });
  }
}
