import { z } from "zod";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "admin.year.date_format" });

export const createYearInputSchema = z
  .object({
    name: z.string().trim().min(1, { error: "admin.year.name_required" }).max(100),
    startsOn: isoDateSchema,
    endsOn: isoDateSchema,
  })
  .strict();

export type CreateYearInput = z.infer<typeof createYearInputSchema>;

export const activateYearInputSchema = z.object({ yearId: z.uuid() }).strict();
export type ActivateYearInput = z.infer<typeof activateYearInputSchema>;

export const closeYearInputSchema = z
  .object({
    yearId: z.uuid(),
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

export type CloseYearInput = z.infer<typeof closeYearInputSchema>;
