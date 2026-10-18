import { z } from "zod";

export const createDeletionRequestInputSchema = z
  .object({
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

export type CreateDeletionRequestInput = z.infer<typeof createDeletionRequestInputSchema>;

export const createChildDeletionRequestInputSchema = z
  .object({
    pupilId: z.uuid(),
    guardianNote: z.string().trim().min(1).max(500),
  })
  .strict();

export type CreateChildDeletionRequestInput = z.infer<typeof createChildDeletionRequestInputSchema>;

export const deletionRequestIdInputSchema = z
  .object({
    requestId: z.uuid(),
  })
  .strict();

export type DeletionRequestIdInput = z.infer<typeof deletionRequestIdInputSchema>;

export const rejectDeletionRequestInputSchema = z
  .object({
    requestId: z.uuid(),
    reason: z
      .string()
      .trim()
      .min(1, { error: "common.errors.reason_required" })
      .max(500),
  })
  .strict();

export type RejectDeletionRequestInput = z.infer<typeof rejectDeletionRequestInputSchema>;

export const executeDeletionInputSchema = z
  .object({
    requestId: z.uuid(),
    confirmWord: z.string().trim().min(1),
    acknowledgePlan: z.literal(true, { error: "admin.deletions.plan_required" }),
  })
  .strict();

export type ExecuteDeletionInput = z.infer<typeof executeDeletionInputSchema>;
