import { z } from "zod";

export const toggleWishlistActionSchema = z.enum(["add", "remove"]);

export const toggleWishlistInputSchema = z.object({
  trainerProfileId: z.string().uuid(),
  action: toggleWishlistActionSchema,
});

export type ToggleWishlistInput = z.infer<typeof toggleWishlistInputSchema>;
