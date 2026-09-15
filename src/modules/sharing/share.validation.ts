import { z } from "zod";

export const CreateShareLinkSchema = z.object({
  closingId: z.string().min(1, "Closing ID is required"),
  durationDays: z.enum(["1", "3", "7", "30"]).transform(Number),
});

export type CreateShareLinkInput = z.infer<typeof CreateShareLinkSchema>;
