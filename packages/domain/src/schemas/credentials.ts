import { z } from "zod";

/**
 * Administrator email + password (ADR-003 v1.1). The email is normalised (trim, lower case): it is
 * the `provider_account_id` of the CREDENTIALS identity.
 */
export const ADMIN_PASSWORD_MIN_LENGTH = 12;

const email = z.string().trim().toLowerCase().pipe(z.email());

/** Sign-in form: any non-empty password is checked against the hash, never against policy. */
export const credentialsLoginSchema = z.object({
  email,
  password: z.string().min(1),
});
export type CredentialsLogin = z.infer<typeof credentialsLoginSchema>;

/**
 * Input of `db:seed:admin` and of the dev-only `db:seed:teacher` (ADR-003 v1.3).
 * The password policy applies when the password is set. Teacher seed does not add a second schema.
 */
export const adminSeedInputSchema = z.object({
  email,
  password: z.string().min(ADMIN_PASSWORD_MIN_LENGTH),
});
export type AdminSeedInput = z.infer<typeof adminSeedInputSchema>;
