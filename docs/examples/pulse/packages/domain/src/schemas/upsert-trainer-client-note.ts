import { z } from "zod";

export const upsertTrainerClientNoteInputSchema = z.object({
  clientId: z.string().uuid(),
  notes: z.string().max(5000),
});

export type UpsertTrainerClientNoteInput = z.infer<
  typeof upsertTrainerClientNoteInputSchema
>;
