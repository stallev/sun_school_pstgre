import "server-only";
import { randomBytes } from "node:crypto";
import { encode } from "@auth/core/jwt";

/**
 * Telegram OIDC workaround §6.1 (telegram_authjs_oidc_portable_guide.md, auth_runtime_spec TG-2):
 * oauth.telegram.org answers `state too long` for state > 256 characters, while @auth/core emits
 * ~430-450. After the Auth.js handler, an authorize redirect to Telegram gets a short opaque state
 * and the `authjs.state` cookie is re-sealed with the same `encode` (CSRF protection is preserved:
 * cookie and query `state` still match).
 */
const TELEGRAM_OAUTH_STATE_MAX_LENGTH = 256;
const TELEGRAM_AUTHORIZE_URL_PREFIX = "https://oauth.telegram.org/";
const STATE_COOKIE_MAX_AGE_SEC = 60 * 15;

function generateShortOAuthState(): string {
  return randomBytes(32).toString("base64url");
}

function isAuthJsStateCookieName(cookieName: string): boolean {
  return cookieName === "authjs.state" || cookieName === "__Secure-authjs.state";
}

function isTelegramAuthorizeUrl(value: string | null | undefined): value is string {
  return typeof value === "string" && value.startsWith(TELEGRAM_AUTHORIZE_URL_PREFIX);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readSetCookieHeaders(headers: Headers): string[] {
  if (typeof headers.getSetCookie !== "function") {
    throw new Error("Headers.getSetCookie is required to rewrite Telegram OAuth state cookies");
  }
  return headers.getSetCookie();
}

function splitSetCookieNameValue(
  setCookieHeader: string,
): { cookieName: string; cookieValue: string; attributes: string } | null {
  const semicolonIndex = setCookieHeader.indexOf(";");
  const nameValuePair =
    semicolonIndex === -1 ? setCookieHeader : setCookieHeader.slice(0, semicolonIndex);
  const attributes = semicolonIndex === -1 ? "" : setCookieHeader.slice(semicolonIndex);
  const equalsIndex = nameValuePair.indexOf("=");
  if (equalsIndex <= 0) return null;
  return {
    cookieName: nameValuePair.slice(0, equalsIndex),
    cookieValue: nameValuePair.slice(equalsIndex + 1),
    attributes,
  };
}

async function sealShortStateCookieValue(params: {
  cookieName: string;
  shortState: string;
  secret: string;
}): Promise<string> {
  return encode({
    secret: params.secret,
    salt: params.cookieName,
    maxAge: STATE_COOKIE_MAX_AGE_SEC,
    token: { value: params.shortState },
  });
}

async function readAuthJsReturnRedirectJson(
  response: Response,
): Promise<Record<string, unknown> | null> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) return null;
  try {
    const parsed: unknown = await response.clone().json();
    if (!isRecord(parsed) || typeof parsed.url !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

async function rewriteAuthJsStateSetCookies(params: {
  setCookieHeaders: string[];
  shortState: string;
  secret: string;
}): Promise<string[]> {
  const rewritten: string[] = [];
  let stateCookieRewritten = false;

  for (const setCookieHeader of params.setCookieHeaders) {
    const parsed = splitSetCookieNameValue(setCookieHeader);
    if (!parsed || !isAuthJsStateCookieName(parsed.cookieName)) {
      rewritten.push(setCookieHeader);
      continue;
    }
    const sealed = await sealShortStateCookieValue({
      cookieName: parsed.cookieName,
      shortState: params.shortState,
      secret: params.secret,
    });
    rewritten.push(`${parsed.cookieName}=${sealed}${parsed.attributes}`);
    stateCookieRewritten = true;
  }

  if (!stateCookieRewritten) {
    // Never hand out the long state: fail instead.
    throw new Error("Auth.js state cookie missing on Telegram authorize redirect");
  }
  return rewritten;
}

export async function rewriteTelegramOAuthAuthorizeState(response: Response): Promise<Response> {
  const location = response.headers.get("location");
  const returnRedirectJson = await readAuthJsReturnRedirectJson(response);
  const jsonAuthorizeUrl =
    typeof returnRedirectJson?.url === "string" ? returnRedirectJson.url : null;

  const authorizeUrlSource = isTelegramAuthorizeUrl(location)
    ? location
    : isTelegramAuthorizeUrl(jsonAuthorizeUrl)
      ? jsonAuthorizeUrl
      : null;
  if (!authorizeUrlSource) return response;

  let authorizeUrl: URL;
  try {
    authorizeUrl = new URL(authorizeUrlSource);
  } catch {
    return response;
  }

  const currentState = authorizeUrl.searchParams.get("state");
  if (!currentState || currentState.length <= TELEGRAM_OAUTH_STATE_MAX_LENGTH) {
    return response;
  }

  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required to rewrite Telegram OAuth state");
  }

  const shortState = generateShortOAuthState();
  authorizeUrl.searchParams.set("state", shortState);
  const shortenedAuthorizeUrl = authorizeUrl.toString();

  const rewrittenSetCookies = await rewriteAuthJsStateSetCookies({
    setCookieHeaders: readSetCookieHeaders(response.headers),
    shortState,
    secret,
  });

  const headers = new Headers(response.headers);
  headers.delete("content-length");
  if (isTelegramAuthorizeUrl(location)) {
    headers.delete("location");
    headers.set("location", shortenedAuthorizeUrl);
  }
  headers.delete("set-cookie");
  for (const setCookieHeader of rewrittenSetCookies) {
    headers.append("set-cookie", setCookieHeader);
  }

  if (!returnRedirectJson) {
    return new Response(null, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  const rewrittenJson = {
    ...returnRedirectJson,
    ...(isTelegramAuthorizeUrl(jsonAuthorizeUrl) ? { url: shortenedAuthorizeUrl } : {}),
  };
  return new Response(JSON.stringify(rewrittenJson), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
