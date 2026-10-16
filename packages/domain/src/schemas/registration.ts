import { z } from "zod";
import { personNameSchema } from "./person-name";

/**
 * Registration input (access_requests §5.2). `strict()`: the client cannot send `status`,
 * `consentVersion`, `userId` — the server takes them from the session and `app_setting`.
 */
export const REGISTRATION_ERROR_KEYS = {
  consentRequired: "auth.register.consent_required",
} as const;

export const registrationInputSchema = personNameSchema
  .extend({
    consentAccepted: z.literal(true, { error: REGISTRATION_ERROR_KEYS.consentRequired }),
  })
  .strict();

export type RegistrationInput = z.infer<typeof registrationInputSchema>;
