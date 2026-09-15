import { z } from "zod";

export const CreateClosingSchema = z.object({
  branchId: z.string().min(1, "Cabang wajib dipilih"),
  closingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)"),
  notes: z.string().max(1000).optional(),
});

export type CreateClosingInput = z.infer<typeof CreateClosingSchema>;

export const ClosingFilterSchema = z.object({
  branchId: z.string().optional(),
  status: z.enum(["ALL", "DRAFT", "SUBMITTED", "REVISION_REQUIRED", "VERIFIED"]).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(10),
});

export type ClosingFilterInput = z.infer<typeof ClosingFilterSchema>;
