import { z } from "zod";

export const registerClientSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2).max(120),
});

export type RegisterClientInput = z.infer<typeof registerClientSchema>;
