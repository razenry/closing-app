"use server";

import { getCurrentUser } from "@/lib/session";
import { FileService } from "@/modules/file/file.service";
import { FileCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function uploadFileAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Sesi tidak valid." };
  }

  const closingId = formData.get("closingId") as string;
  const category = formData.get("category") as FileCategory;
  const gramasi = (formData.get("gramasi") as string) || null;
  const file = formData.get("file") as globalThis.File | null;

  if (!closingId || !category || !file) {
    return { error: "Dokumen dan data closing wajib diisi." };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await FileService.uploadFile({
      user,
      closingId,
      category,
      gramasi,
      originalFilename: file.name,
      mimeType: file.type || "application/octet-stream",
      buffer,
    });

    revalidatePath(`/closings/${closingId}`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Gagal mengunggah file." };
  }
}

export async function deleteFileAction(fileId: string, closingId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Sesi tidak valid." };
  }

  try {
    await FileService.deleteFile(user, fileId);
    revalidatePath(`/closings/${closingId}`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Gagal menghapus file." };
  }
}
