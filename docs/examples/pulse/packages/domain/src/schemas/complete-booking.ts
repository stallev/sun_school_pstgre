import { z } from "zod";

export const completeBookingInputSchema = z.object({
  bookingId: z.string().uuid(),
});

export type CompleteBookingInput = z.infer<typeof completeBookingInputSchema>;
