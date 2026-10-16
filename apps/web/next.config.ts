import path from "node:path";
import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

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
 * Security headers / CSP are added with the first public routes (rule security-xss-csrf).
 */
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // `forbidden()` (AZ-D3: a 403 page for a wrong role) is experimental in Next.js 16.4.
  experimental: { authInterrupts: true },
  transpilePackages: [
    "@sunschool/domain",
    "@sunschool/db",
    "@sunschool/policy-edge",
    "@sunschool/policy-server",
  ],
  serverExternalPackages: ["pg"],
};

export default nextConfig;
