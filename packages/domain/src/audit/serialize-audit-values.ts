/**
 * Serializes `old_value` / `new_value` of an audit record (change_log_contract §5 L-3, L-7, INV-23):
 * personal data and secrets MUST NOT reach the journal. Keys are matched case-insensitively with
 * `_` / `-` removed, at any depth; the whole branch is dropped, not masked.
 */
const FORBIDDEN_KEYS: ReadonlySet<string> = new Set([
  "lastname",
  "firstname",
  "middlename",
  "fullname",
  "fullnamesnapshot",
  "name",
  "email",
  "username",
  "phone",
  "providerid",
  "provideraccountid",
  "accountid",
  "token",
  "accesstoken",
  "refreshtoken",
  "idtoken",
  "secret",
  "password",
  "authsecret",
]);

const normalize = (key: string) => key.replace(/[-_]/g, "").toLowerCase();

export type AuditJson = null | boolean | number | string | AuditJson[] | { [key: string]: AuditJson };

const sanitize = (value: unknown): AuditJson | undefined => {
  if (value === null) return null;
  if (value === undefined || typeof value === "function" || typeof value === "symbol") return undefined;
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item) ?? null);
  }
  if (typeof value === "object") {
    const out: { [key: string]: AuditJson } = {};
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
      if (FORBIDDEN_KEYS.has(normalize(key))) continue;
      const cleaned = sanitize(inner);
      if (cleaned !== undefined) out[key] = cleaned;
    }
    return out;
  }
  return undefined;
};

/** Returns a JSON-safe copy without forbidden keys, or `null` when there is nothing to store. */
export const serializeAuditValues = (values: unknown): AuditJson | null => {
  const cleaned = sanitize(values);
  if (cleaned === undefined) return null;
  if (typeof cleaned === "object" && cleaned !== null && !Array.isArray(cleaned)) {
    return Object.keys(cleaned).length === 0 ? null : cleaned;
  }
  return cleaned;
};
