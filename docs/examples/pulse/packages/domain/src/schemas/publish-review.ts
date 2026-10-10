import { z } from "zod";

export const publishReviewInputSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(20).max(500),
});

export type PublishReviewInput = z.infer<typeof publishReviewInputSchema>;
