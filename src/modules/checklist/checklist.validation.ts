import { z } from "zod";

export const GRAMMASI_LIST = [
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

export const NON_GRAMMASI_LIST = [
  "stock_excel",
  "recap_photo",
] as const;

export const ALL_CHECKLIST_ITEMS = [
  ...GRAMMASI_LIST,
  ...NON_GRAMMASI_LIST,
] as const;

export type GramasiType = (typeof GRAMMASI_LIST)[number];
export type ChecklistItemType = (typeof ALL_CHECKLIST_ITEMS)[number];

export const CHECKLIST_ITEM_LABELS: Record<ChecklistItemType, string> = {
  "0.5g": "Foto Stok 0.5g",
  "1g": "Foto Stok 1g",
  "2g": "Foto Stok 2g",
  "3g": "Foto Stok 3g",
  "5g": "Foto Stok 5g",
  "10g": "Foto Stok 10g",
  "25g": "Foto Stok 25g",
  "50g": "Foto Stok 50g",
  "100g": "Foto Stok 100g",
  "stock_excel": "Stock Excel",
  "recap_photo": "Recap Photo",
};

export const UpdateStockStatusSchema = z.object({
  closingId: z.string().min(1, "Closing ID is required"),
  gramasi: z.enum(GRAMMASI_LIST),
  stockStatus: z.enum(["HAS_STOCK", "NO_STOCK"]),
  notes: z.string().max(500).optional(),
});

export type UpdateStockStatusInput = z.infer<typeof UpdateStockStatusSchema>;
