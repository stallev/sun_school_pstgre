import { z } from "zod";

export const loginCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginCredentialsInput = z.infer<typeof loginCredentialsSchema>;
