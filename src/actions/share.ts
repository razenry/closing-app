"use server";

import { getCurrentUser } from "@/lib/session";
import { ShareService } from "@/modules/sharing/share.service";
import { revalidatePath } from "next/cache";

export async function createShareLinkAction(closingId: string, durationDays: number) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Sesi tidak valid." };
  }

  try {
    const result = await ShareService.createShareLink({
      user,
      closingId,
      durationDays,
    });
    revalidatePath(`/closings/${closingId}`);
    return {
      success: true,
      shareUrl: result.shareUrl,
      rawToken: result.rawToken,
    };
  } catch (err: any) {
    return { error: err.message || "Gagal membuat tautan berbagi." };
  }
}

export async function revokeShareLinkAction(shareLinkId: string, closingId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Sesi tidak valid." };
  }

  try {
    await ShareService.revokeShareLink(user, shareLinkId);
    revalidatePath(`/closings/${closingId}`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Gagal mencabut tautan." };
  }
}
