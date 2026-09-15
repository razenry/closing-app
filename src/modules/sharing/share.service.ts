import { ShareRepository } from "./share.repository";
import { generateSecureToken, hashToken } from "@/lib/security/token";
import { AuthUser, PermissionService } from "@/lib/permissions";
import { ActivityAction } from "@prisma/client";
import { ActivityService } from "../activity/activity.service";
import { prisma } from "@/lib/db/prisma";

export type ShareValidationResult =
  | { status: "VALID"; closing: any; shareLink: any }
  | { status: "NOT_FOUND"; message: string }
  | { status: "EXPIRED"; message: string }
  | { status: "REVOKED"; message: string };

export class ShareService {
  /**
   * Generates a secure share link with token hashing and expiration.
   */
  static async createShareLink(params: {
    user: AuthUser;
    closingId: string;
    durationDays: number;
    baseUrl?: string;
  }) {
    const { user, closingId, durationDays, baseUrl } = params;

    const closing = await prisma.closing.findUnique({
      where: { id: closingId },
      include: { branch: true },
    });

    if (!closing) {
      throw new Error("Closing tidak ditemukan.");
    }

    if (!PermissionService.canGenerateShareLink(user, closing)) {
      throw new Error("Anda tidak memiliki izin untuk membuat tautan berbagi closing ini.");
    }

    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const shareLink = await ShareRepository.create({
      closingId,
      tokenHash,
      expiresAt,
      createdById: user.id,
    });

    await ActivityService.log({
      actorId: user.id,
      closingId,
      action: ActivityAction.CREATE_SHARE_LINK,
      description: `Membuat tautan berbagi publik (berlaku ${durationDays} hari)`,
      metadata: { shareLinkId: shareLink.id, durationDays, expiresAt },
    });

    const origin = baseUrl || process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
    const shareUrl = `${origin}/share/${rawToken}`;

    return {
      shareLink,
      rawToken,
      shareUrl,
    };
  }

  /**
   * Validates raw token from URL.
   * Checks expiration and revocation.
   */
  static async validateToken(rawToken: string): Promise<ShareValidationResult> {
    if (!rawToken || rawToken.length < 16) {
      return { status: "NOT_FOUND", message: "Tautan berbagi tidak valid atau tidak ditemukan." };
    }

    const tokenHash = hashToken(rawToken);
    const link = await ShareRepository.findByTokenHash(tokenHash);

    if (!link) {
      return { status: "NOT_FOUND", message: "Tautan berbagi tidak ditemukan." };
    }

    if (link.revokedAt) {
      return { status: "REVOKED", message: "Tautan berbagi ini telah dicabut." };
    }

    if (new Date() > new Date(link.expiresAt)) {
      return { status: "EXPIRED", message: "Tautan berbagi ini telah kedaluwarsa." };
    }

    return {
      status: "VALID",
      closing: link.closing,
      shareLink: link,
    };
  }

  /**
   * Revokes a share link.
   */
  static async revokeShareLink(user: AuthUser, shareLinkId: string) {
    const link = await prisma.shareLink.findUnique({
      where: { id: shareLinkId },
      include: { closing: true },
    });

    if (!link) {
      throw new Error("Tautan berbagi tidak ditemukan.");
    }

    if (!PermissionService.canViewClosing(user, link.closing)) {
      throw new Error("Anda tidak memiliki izin untuk mencabut tautan ini.");
    }

    const revoked = await ShareRepository.revoke(shareLinkId);

    await ActivityService.log({
      actorId: user.id,
      closingId: link.closingId,
      action: ActivityAction.REVOKE_SHARE_LINK,
      description: "Mencabut tautan berbagi publik.",
      metadata: { shareLinkId },
    });

    return revoked;
  }

  static async listForClosing(closingId: string) {
    return ShareRepository.listByClosingId(closingId);
  }
}
