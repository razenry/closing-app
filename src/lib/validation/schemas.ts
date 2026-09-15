import { z } from "zod";

export const GRAMMAGES = [
  "0.5g",
  "1g",
  "2g",
  "3g",
  "5g",
  "10g",
  "25g",
  "50g",
  "100g",
] as const;

export const NON_GRAMMAGE_ITEMS = [
  "stock_excel",
  "recap_photo",
] as const;

export const ALL_CHECKLIST_KEYS = [
  ...GRAMMAGES,
  ...NON_GRAMMAGE_ITEMS,
] as const;

export type ChecklistKey = (typeof ALL_CHECKLIST_KEYS)[number];

export const CHECKLIST_LABELS: Record<ChecklistKey, string> = {
  "0.5g": "Foto stok 0.5g",
  "1g": "Foto stok 1g",
  "2g": "Foto stok 2g",
  "3g": "Foto stok 3g",
  "5g": "Foto stok 5g",
  "10g": "Foto stok 10g",
  "25g": "Foto stok 25g",
  "50g": "Foto stok 50g",
  "100g": "Foto stok 100g",
  "stock_excel": "Stock Excel",
  "recap_photo": "Recap Photo",
};

// 1. CreateClosingSchema
export const CreateClosingSchema = z.object({
  branchId: z.string().min(1, "Branch is required"),
  closingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  notes: z.string().max(1000).optional(),
});

export type CreateClosingInput = z.infer<typeof CreateClosingSchema>;

// 2. ChecklistSchema
export const ChecklistItemSchema = z.object({
  itemKey: z.enum(ALL_CHECKLIST_KEYS),
  status: z.enum(["HAS_STOCK", "NO_STOCK", "NOT_SET"]),
  notes: z.string().max(500).optional(),
});

export const ChecklistSchema = z.object({
  closingId: z.string().min(1, "Closing ID is required"),
  items: z.array(ChecklistItemSchema),
});

export type ChecklistInput = z.infer<typeof ChecklistSchema>;

// 3. UploadFileSchema
export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf", ".xls", ".xlsx"] as const;
export const FORBIDDEN_EXTENSIONS = [".exe", ".zip", ".php", ".js"] as const;

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
] as const;

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export const UploadFileSchema = z.object({
  closingId: z.string().min(1, "Closing ID is required"),
  category: z.enum(["STOCK_PHOTO", "STOCK_EXCEL", "RECAP_PHOTO"]),
  grammage: z.enum(GRAMMAGES).optional().nullable(),
  filename: z.string().min(1, "Filename is required"),
  mimeType: z.string().min(1, "MIME type is required"),
  size: z.number().max(MAX_FILE_SIZE_BYTES, "Maximum file size is 25MB"),
}).refine((data) => {
  if (data.category === "STOCK_PHOTO" && !data.grammage) {
    return false;
  }
  return true;
}, {
  message: "STOCK_PHOTO wajib mempunyai gramasi",
  path: ["grammage"],
});

export type UploadFileInput = z.infer<typeof UploadFileSchema>;

// 4. RevisionRequestSchema
export const RevisionRequestSchema = z.object({
  closingId: z.string().min(1, "Closing ID is required"),
  note: z.string().trim().min(3, "Revision note must be at least 3 characters long"),
});

export type RevisionRequestInput = z.infer<typeof RevisionRequestSchema>;

// 5. ShareLinkSchema
export const ShareLinkSchema = z.object({
  closingId: z.string().min(1, "Closing ID is required"),
  durationDays: z.enum(["1", "3", "7", "30"]).transform(Number),
});

export type ShareLinkInput = z.infer<typeof ShareLinkSchema>;

// 6. SearchFilterSchema
export const SearchFilterSchema = z.object({
  branch: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "REVISION_REQUIRED", "VERIFIED", "ALL"]).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
});

export type SearchFilterInput = z.infer<typeof SearchFilterSchema>;
