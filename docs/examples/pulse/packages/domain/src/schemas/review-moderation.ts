import { z } from "zod";

export const hideReviewInputSchema = z.object({
  reviewId: z.string().uuid(),
});

export type HideReviewInput = z.infer<typeof hideReviewInputSchema>;

export const deleteReviewInputSchema = z.object({
  reviewId: z.string().uuid(),
});

export type DeleteReviewInput = z.infer<typeof deleteReviewInputSchema>;
