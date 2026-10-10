import { z } from "zod";

export const createBookingInputSchema = z.object({
  trainerProfileId: z.string().uuid(),
  trainerServiceId: z.string().uuid(),
  startsAtUtc: z.string().datetime(),
  clientMessage: z
    .string()
    .max(500)
    .optional()
    .transform((value) => value?.trim() || undefined),
});

export type CreateBookingInput = z.infer<typeof createBookingInputSchema>;
