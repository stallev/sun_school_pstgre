import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { LOGIN_PROVIDER, type LoginProvider } from "@sunschool/domain";
import { getServerEnv } from "@/lib/env.server";

/** auth_runtime_spec §7 · ADR-003 §4.5 */
export const LINK_INTENT_COOKIE_NAME = "sunschool.link-intent";
export const LINK_INTENT_PATH = "/api/auth";
export const LINK_INTENT_TTL_MS = 10 * 60 * 1000;

export type LinkIntentPayload = {
  uid: string;
  provider: LoginProvider;
  nonce: string;
  exp: number;
};

const encodePayload = (payload: LinkIntentPayload): string =>
  Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");

const decodePayload = (encoded: string): LinkIntentPayload | null => {
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as LinkIntentPayload;
    if (
      typeof parsed.uid !== "string" ||
      typeof parsed.nonce !== "string" ||
      typeof parsed.exp !== "number" ||
      (parsed.provider !== LOGIN_PROVIDER.TELEGRAM && parsed.provider !== LOGIN_PROVIDER.CREDENTIALS)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const signLinkIntentValue = (payload: LinkIntentPayload, secret: string): string => {
  const body = encodePayload(payload);
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
};

export const parseLinkIntentValue = (value: string, secret: string, now: Date): LinkIntentPayload | null => {
  const [body, sig] = value.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return null;
  const payload = decodePayload(body);
  if (!payload || payload.exp <= now.getTime()) return null;
  return payload;
};

const cookieOptions = (expires: Date) => {
  const { APP_ENV } = getServerEnv();
  return {
    httpOnly: true,
    secure: APP_ENV === "prod",
    sameSite: "lax" as const,
    path: LINK_INTENT_PATH,
    expires,
  };
};

export async function createLinkIntentCookie(input: {
  uid: string;
  provider: LoginProvider;
  now: Date;
}): Promise<void> {
  const { AUTH_SECRET } = getServerEnv();
  const exp = input.now.getTime() + LINK_INTENT_TTL_MS;
  const payload: LinkIntentPayload = {
    uid: input.uid,
    provider: input.provider,
    nonce: randomBytes(16).toString("hex"),
    exp,
  };
  const store = await cookies();
  store.set(LINK_INTENT_COOKIE_NAME, signLinkIntentValue(payload, AUTH_SECRET), cookieOptions(new Date(exp)));
}

export async function parseLinkIntentCookie(now: Date): Promise<LinkIntentPayload | null> {
  const store = await cookies();
  const raw = store.get(LINK_INTENT_COOKIE_NAME)?.value;
  if (!raw) return null;
  const { AUTH_SECRET } = getServerEnv();
  return parseLinkIntentValue(raw, AUTH_SECRET, now);
}

export async function clearLinkIntentCookie(): Promise<void> {
  const store = await cookies();
  store.set(LINK_INTENT_COOKIE_NAME, "", { ...cookieOptions(new Date(0)), maxAge: 0 });
}
