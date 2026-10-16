/**
 * Maps the Telegram OIDC ID-token claims to the Auth.js user (auth_runtime_spec §4.1, ADR-003 §4.1).
 * Scopes `openid profile phone`: `sub`, `name`, `preferred_username`, `picture`, `phone_number`.
 * `preferred_username` and `phone_number` are OPTIONAL (no username on the account / the user did
 * not share the phone, Q-05): a missing value is `null`, never an error. Pure and edge-safe.
 */
export type TelegramClaims = Record<string, unknown>;

export type TelegramProfileUser = {
  id: string;
  name?: string;
  image?: string;
  email: null;
  username: string | null;
  phone: string | null;
};

const asNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

/** Telegram username without a leading `@`; `null` when absent. */
export const normalizeTelegramUsername = (value: unknown): string | null => {
  const text = asNonEmptyString(value);
  if (text === null) return null;
  const bare = text.replace(/^@+/, "");
  return bare === "" ? null : bare;
};

/** Phone as Telegram sends it (digits, optional `+`), spaces removed; `null` when absent. */
export const normalizeTelegramPhone = (value: unknown): string | null => {
  const text = asNonEmptyString(value);
  if (text === null) return null;
  const compact = text.replace(/[\s()-]/g, "");
  return compact === "" ? null : compact;
};

export const mapTelegramProfile = (claims: TelegramClaims): TelegramProfileUser => {
  const id = asNonEmptyString(claims.sub) ?? asNonEmptyString(claims.id) ?? asNonEmptyString(String(claims.id ?? ""));
  // An identity without a Telegram id must never be created (empty provider_account_id): fail the sign-in.
  if (id === null) throw new Error("Telegram profile has no subject");
  return {
    id,
    name: asNonEmptyString(claims.name) ?? undefined,
    image: asNonEmptyString(claims.picture) ?? undefined,
    email: null,
    username: normalizeTelegramUsername(claims.preferred_username),
    phone: normalizeTelegramPhone(claims.phone_number),
  };
};
