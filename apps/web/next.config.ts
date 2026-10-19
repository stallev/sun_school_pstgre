import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";
import { getBaselineSecurityHeaderEntries } from "./src/lib/security/request-security";

// One git-ignored .env at the repo root serves the app, the Prisma CLI and the seed scripts
// (local_dev_setup.md §6). Next.js itself only reads apps/web/.env*, so the root file is loaded here.
loadEnvConfig(
  path.resolve(process.cwd(), "../.."),
  process.env.NODE_ENV !== "production",
  { info: () => {}, error: console.error },
  true, // forceReload: Next has already cached the env of apps/web
);

/**
 * Next.js 16.4 — ADR-002 §5.1: Instant Navigations need cacheComponents first, then partialPrefetching.
 * Workspace packages ship TypeScript sources, so they are transpiled by Next.
 * Baseline security headers on static assets; per-request CSP nonce in `src/proxy.ts`.
 */
const nextConfig: NextConfig = {
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  // `forbidden()` (AZ-D3: a 403 page for a wrong role) is experimental in Next.js 16.4.
  experimental: {
    authInterrupts: true,
    serverActions: {
      allowedOrigins: resolveServerActionAllowedOrigins(),
    },
  },
  async headers() {
    const baseline = getBaselineSecurityHeaderEntries();
    return [
      {
        source: "/:path*",
        headers: baseline.map(({ key, value }) => ({ key, value })),
      },
    ];
  },
  transpilePackages: [
    "@sunschool/domain",
    "@sunschool/db",
    "@sunschool/policy-edge",
    "@sunschool/policy-server",
  ],
  serverExternalPackages: ["pg"],
};

function resolveServerActionAllowedOrigins(): string[] | undefined {
  const authUrl = process.env.AUTH_URL?.trim();
  if (!authUrl) {
    return undefined;
  }
  try {
    return [new URL(authUrl).host];
  } catch {
    return undefined;
  }
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  silent: !process.env.CI,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
