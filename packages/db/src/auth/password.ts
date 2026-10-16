import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * Administrator password hashing (ADR-003 v1.1 §4.1, auth_runtime_spec §4.4, Q-06): scrypt from
 * `node:crypto`, N=2^15, r=8, p=1, 16-byte salt, 64-byte key. Stored as
 * `scrypt$N$r$p$<salt base64>$<key base64>` — parameters travel with the hash, so they can change later.
 * The plain password and the hash are never logged, audited or returned to a client.
 */
const SCRYPT_N = 2 ** 15;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SALT_BYTES = 16;
const KEY_BYTES = 64;
const FORMAT_PREFIX = "scrypt";

const derive = (password: string, salt: Buffer, keyLength: number, options: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) => {
    // N=2^15, r=8 needs ~32 MiB; Node's default maxmem (32 MiB) is exactly on the edge.
    scrypt(password.normalize("NFKC"), salt, keyLength, { maxmem: 128 * 1024 * 1024, ...options }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(password, salt, KEY_BYTES, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return [FORMAT_PREFIX, SCRYPT_N, SCRYPT_R, SCRYPT_P, salt.toString("base64"), key.toString("base64")].join("$");
}

type ParsedHash = { n: number; r: number; p: number; salt: Buffer; key: Buffer };

const parseHash = (stored: string): ParsedHash | null => {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== FORMAT_PREFIX) return null;
  const [, nText, rText, pText, saltText, keyText] = parts;
  const n = Number(nText);
  const r = Number(rText);
  const p = Number(pText);
  if (![n, r, p].every((value) => Number.isInteger(value) && value > 0)) return null;
  // A power of two N, and a ceiling so a corrupted row cannot demand unbounded memory.
  if ((n & (n - 1)) !== 0 || n > 2 ** 20 || r > 32 || p > 16) return null;
  const salt = Buffer.from(saltText ?? "", "base64");
  const key = Buffer.from(keyText ?? "", "base64");
  if (salt.length === 0 || key.length === 0) return null;
  return { n, r, p, salt, key };
};

/** Constant-time check; a malformed stored value is simply "not a match". */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parsed = parseHash(stored);
  if (!parsed) return false;
  const candidate = await derive(password, parsed.salt, parsed.key.length, {
    N: parsed.n,
    r: parsed.r,
    p: parsed.p,
  });
  return candidate.length === parsed.key.length && timingSafeEqual(candidate, parsed.key);
}

let dummyHash: Promise<string> | undefined;

/**
 * A valid hash of a random password, computed once. Verifying against it when the email is unknown
 * costs the same time as a real check, so response time does not reveal which emails exist.
 */
export const getDummyPasswordHash = (): Promise<string> => {
  dummyHash ??= hashPassword(randomBytes(24).toString("base64"));
  return dummyHash;
};
