import { z } from "zod";

export const approveTrainerInputSchema = z.object({
  trainerProfileId: z.string().uuid(),
});

export type ApproveTrainerInput = z.infer<typeof approveTrainerInputSchema>;

export const rejectTrainerInputSchema = z.object({
  trainerProfileId: z.string().uuid(),
  rejectionReason: z.string().trim().min(10).max(2000),
});

export type RejectTrainerInput = z.infer<typeof rejectTrainerInputSchema>;
