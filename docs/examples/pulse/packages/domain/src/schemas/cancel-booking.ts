import { z } from "zod";

export const cancelBookingInputSchema = z.object({
  bookingId: z.string().uuid(),
});

export type CancelBookingInput = z.infer<typeof cancelBookingInputSchema>;
