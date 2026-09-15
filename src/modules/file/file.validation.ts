import { z } from "zod";
import { GRAMMASI_LIST } from "../checklist/checklist.validation";
import path from "path";

export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf", ".xls", ".xlsx"] as const;
export const FORBIDDEN_EXTENSIONS = [".exe", ".zip", ".php", ".js", ".sh", ".bat"] as const;

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
] as const;

export function getMaxFileSizeMB(): number {
  const envVal = process.env.MAX_FILE_SIZE_MB;
  if (envVal && !isNaN(Number(envVal))) {
    return Number(envVal);
  }
  return 10; // Default 10MB
}

export function validateFileSecurity(filename: string, mimeType: string, size: number) {
  const ext = path.extname(filename).toLowerCase();

  if (FORBIDDEN_EXTENSIONS.includes(ext as any)) {
    throw new Error(`Format file berbahaya ditolak: ${ext}`);
  }

  if (!ALLOWED_EXTENSIONS.includes(ext as any)) {
    throw new Error(`Format file tidak didukung: ${ext}. Gunakan: ${ALLOWED_EXTENSIONS.join(", ")}`);
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType as any)) {
    throw new Error(`MIME type file tidak valid: ${mimeType}`);
  }

  const maxBytes = getMaxFileSizeMB() * 1024 * 1024;
  if (size > maxBytes) {
    throw new Error(`Ukuran file melebihi batas maksimal ${getMaxFileSizeMB()}MB`);
  }

  return true;
}

export const FileUploadSchema = z.object({
  closingId: z.string().min(1, "Closing ID is required"),
  category: z.enum(["STOCK_PHOTO", "STOCK_EXCEL", "RECAP_PHOTO"]),
  gramasi: z.enum(GRAMMASI_LIST).optional().nullable(),
}).refine((data) => {
  if (data.category === "STOCK_PHOTO" && !data.gramasi) {
    return false;
  }
  return true;
}, {
  message: "STOCK_PHOTO wajib mempunyai gramasi",
  path: ["gramasi"],
});

export type FileUploadInput = z.infer<typeof FileUploadSchema>;
