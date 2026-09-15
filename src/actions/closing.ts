"use server";

import { getCurrentUser } from "@/lib/session";
import { ClosingService } from "@/modules/closing/closing.service";
import { ChecklistRepository } from "@/modules/checklist/checklist.repository";
import { ChecklistService } from "@/modules/checklist/checklist.service";
import { RevisionService } from "@/modules/revision/revision.service";
import { StockStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createClosingAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Sesi telah berakhir, silakan login kembali." };
  }

  const branchId = formData.get("branchId") as string;
  const closingDate = formData.get("closingDate") as string;
  const notes = (formData.get("notes") as string) || undefined;

  if (!branchId || !closingDate) {
    return { error: "Cabang dan tanggal closing wajib diisi." };
  }

  try {
    const closing = await ClosingService.createClosing({
      user,
      branchId,
      closingDateString: closingDate,
      notes,
    });
    revalidatePath("/closings");
    revalidatePath("/dashboard");
    return { success: true, closingId: closing.id };
  } catch (err: any) {
    return { error: err.message || "Gagal membuat closing." };
  }
}

export async function updateStockStatusAction(
  closingId: string,
  gramasi: string,
  stockStatus: StockStatus,
  notes?: string
) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Sesi tidak valid." };
  }

  try {
    const closing = await ClosingService.getClosingDetail(user, closingId);
    if (!closing) {
      return { error: "Closing tidak ditemukan." };
    }

    if (closing.status === "VERIFIED") {
      return { error: "Closing sudah diverifikasi dan tidak dapat diubah." };
    }

    await ChecklistRepository.updateStatus(closingId, gramasi, stockStatus, false, notes);
    await ChecklistService.syncCompleteness(closingId);

    revalidatePath(`/closings/${closingId}`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Gagal memperbarui status stok." };
  }
}

export async function submitClosingAction(closingId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Sesi tidak valid." };
  }

  try {
    await ClosingService.submitClosing(user, closingId);
    revalidatePath(`/closings/${closingId}`);
    revalidatePath("/dashboard");
    revalidatePath("/closings");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Gagal submit closing." };
  }
}

export async function requestRevisionAction(closingId: string, note: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Sesi tidak valid." };
  }

  try {
    await RevisionService.requestRevision({
      user,
      closingId,
      note,
    });
    revalidatePath(`/closings/${closingId}`);
    revalidatePath("/dashboard");
    revalidatePath("/closings");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Gagal meminta revisi." };
  }
}

export async function startFixingRevisionAction(closingId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Sesi tidak valid." };
  }

  try {
    await RevisionService.startFixingRevision(user, closingId);
    revalidatePath(`/closings/${closingId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Gagal memulai perbaikan revisi." };
  }
}

export async function verifyClosingAction(closingId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Sesi tidak valid." };
  }

  try {
    await ClosingService.verifyClosing(user, closingId);
    revalidatePath(`/closings/${closingId}`);
    revalidatePath("/dashboard");
    revalidatePath("/closings");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Gagal memverifikasi closing." };
  }
}
