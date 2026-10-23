import { z } from "zod";

const phonesSchema = z.array(z.string().trim().min(1)).default([]);

const emailSchema = z
  .string()
  .trim()
  .email({ error: "admin.family.email_invalid" })
  .or(z.literal(""))
  .transform((value) => (value === "" ? undefined : value))
  .optional();

export const updateOwnAdultContactsInputSchema = z
  .object({
    phones: phonesSchema,
    email: emailSchema,
  })
  .strict();

export type UpdateOwnAdultContactsInput = z.infer<typeof updateOwnAdultContactsInputSchema>;
