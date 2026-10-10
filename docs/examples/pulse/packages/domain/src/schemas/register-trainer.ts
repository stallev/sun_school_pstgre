import { z } from "zod";

export const registerTrainerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2).max(120),
});

export type RegisterTrainerInput = z.infer<typeof registerTrainerSchema>;
