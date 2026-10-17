/**
 * Maps the Telegram OIDC ID-token claims to the Auth.js user (auth_runtime_spec §4.1, ADR-003 §4.1).
 * Scope `openid` only: persist `sub` as `provider_account_id`; name, picture, username and phone are not stored.
 */
export type TelegramClaims = Record<string, unknown>;

export type TelegramProfileUser = {
  id: string;
  email: null;
};

const asNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

export const mapTelegramProfile = (claims: TelegramClaims): TelegramProfileUser => {
  const id = asNonEmptyString(claims.sub) ?? asNonEmptyString(claims.id) ?? asNonEmptyString(String(claims.id ?? ""));
  // An identity without a Telegram id must never be created (empty provider_account_id): fail the sign-in.
  if (id === null) throw new Error("Telegram profile has no subject");
  return {
    id,
    email: null,
  };
};
