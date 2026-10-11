import { z } from "zod";

/**
 * Person name — access_requests_and_roles_contract §4, forms_and_validation_ux §5 (РГ-3):
 * Unicode letters, space, hyphen, apostrophe; 1–50 characters after trim.
 * Error messages are dictionary KEYS (resolved in the UI), never display text.
 */
export const PERSON_NAME_MAX_LENGTH = 50;

const NAME_CHARS = /^[\p{L}\p{M}][\p{L}\p{M} '’-]*$/u;

export const PERSON_NAME_ERROR_KEYS = {
  required: "auth.register.err_name",
  chars: "auth.register.err_chars",
} as const;

const nameBase = z.string().trim().max(PERSON_NAME_MAX_LENGTH, PERSON_NAME_ERROR_KEYS.required);

const requiredName = nameBase
  .min(1, PERSON_NAME_ERROR_KEYS.required)
  .regex(NAME_CHARS, PERSON_NAME_ERROR_KEYS.chars);

const optionalName = nameBase
  .refine((value) => value === "" || NAME_CHARS.test(value), PERSON_NAME_ERROR_KEYS.chars)
  .transform((value) => (value === "" ? undefined : value))
  .optional();

export const personNameSchema = z.object({
  lastName: requiredName,
  firstName: requiredName,
  middleName: optionalName,
});

export type PersonName = z.infer<typeof personNameSchema>;
