/**
 * Telegram OIDC workaround §6.2 (telegram_authjs_oidc_portable_guide.md, auth_runtime_spec TG-3):
 * the discovery document of oauth.telegram.org has no `userinfo_endpoint`, and @auth/core reads it
 * before honoring `idToken: true`. A synthetic value is injected into the discovery JSON only;
 * with `idToken: true` Auth.js never calls that URL.
 * Edge-safe: no Node-only imports.
 */
const TELEGRAM_OIDC_ISSUER = "https://oauth.telegram.org";
const TELEGRAM_OIDC_SYNTHETIC_USERINFO_ENDPOINT = "https://oauth.telegram.org/userinfo";
const TELEGRAM_OIDC_DISCOVERY_PATH = "/.well-known/openid-configuration";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readFetchUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function isTelegramOidcDiscoveryUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.origin === TELEGRAM_OIDC_ISSUER && url.pathname === TELEGRAM_OIDC_DISCOVERY_PATH;
  } catch {
    return false;
  }
}

export async function fetchTelegramOidcWithSyntheticUserinfo(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);
  if (!isTelegramOidcDiscoveryUrl(readFetchUrl(input)) || !response.ok) {
    return response;
  }

  let metadata: unknown;
  try {
    metadata = await response.clone().json();
  } catch {
    return response;
  }
  if (!isRecord(metadata)) return response;

  const existing = metadata.userinfo_endpoint;
  if (typeof existing === "string" && existing.trim().length > 0) {
    return response;
  }

  return Response.json({
    ...metadata,
    userinfo_endpoint: TELEGRAM_OIDC_SYNTHETIC_USERINFO_ENDPOINT,
  });
}
