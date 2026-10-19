import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const NONCE_HEADER = "x-nonce";

export function createCspNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

function isDevRuntime(): boolean {
  return process.env.APP_ENV === "dev" || process.env.NODE_ENV !== "production";
}

/** Content-Security-Policy for HTML navigations (proxy.ts). */
export function buildContentSecurityPolicy(nonce: string): string {
  const scriptSrc = isDevRuntime()
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' https:`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:`;

  const directives = [
    "default-src 'self'",
    scriptSrc,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,
    "img-src 'self' blob: data: https:",
    "font-src 'self'",
    "connect-src 'self' https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://oauth.telegram.org",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  if (!isDevRuntime()) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

/** Baseline headers for all routes (also mirrored in next.config.ts for static assets). */
export function getBaselineSecurityHeaderEntries(): { key: string; value: string }[] {
  const entries: { key: string; value: string }[] = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  ];

  if (!isDevRuntime()) {
    entries.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }

  return entries;
}

function applyResponseSecurityHeaders(response: NextResponse, nonce: string): void {
  response.headers.set("Content-Security-Policy", buildContentSecurityPolicy(nonce));
  response.headers.set(NONCE_HEADER, nonce);
  for (const { key, value } of getBaselineSecurityHeaderEntries()) {
    response.headers.set(key, value);
  }
}

function copySetCookieHeaders(from: NextResponse, to: NextResponse): void {
  if (typeof from.headers.getSetCookie === "function") {
    for (const cookie of from.headers.getSetCookie()) {
      to.headers.append("set-cookie", cookie);
    }
  }
}

/**
 * Injects per-request CSP nonce (for RSC via `headers()`) and baseline security headers.
 */
export function applyRequestSecurity(request: NextRequest, response: NextResponse): NextResponse {
  const nonce = createCspNonce();
  const isRedirect = response.status >= 300 && response.status < 400;

  const secured = isRedirect
    ? response
    : NextResponse.next({
        request: {
          headers: (() => {
            const requestHeaders = new Headers(request.headers);
            requestHeaders.set(NONCE_HEADER, nonce);
            return requestHeaders;
          })(),
        },
      });

  if (!isRedirect) {
    copySetCookieHeaders(response, secured);
  }

  applyResponseSecurityHeaders(secured, nonce);
  return secured;
}
