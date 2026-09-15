import { prisma } from "@/lib/db/prisma";
import { ActivityAction } from "@prisma/client";

export interface CreateActivityLogParams {
  actorId: string;
  closingId: string;
  action: ActivityAction;
  description: string;
  metadata?: Record<string, unknown> | null;
}

export class ActivityRepository {
  static async create(params: CreateActivityLogParams) {
    return prisma.activityLog.create({
      data: {
        actorId: params.actorId,
        closingId: params.closingId,
        action: params.action,
        description: params.description,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
      include: {
        actor: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }

  static async listByClosingId(closingId: string) {
    return prisma.activityLog.findMany({
      where: { closingId },
      include: {
        actor: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
