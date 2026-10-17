// Root Vitest config. Profile `lean` (docs/meta/project_quality_profile.md, D4/D7): unit tests in
// packages/domain and policy checks for S paths; no coverage thresholds; no e2e.
// Guide: docs/guidelines/testing/ai_testing_guidelines.md
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // apps/web path alias and the `server-only` marker (a no-op outside the React server graph).
      "@": path.resolve(import.meta.dirname, "apps/web/src"),
      "server-only": path.resolve(import.meta.dirname, "apps/web/src/test/server-only-stub.ts"),
    },
  },
  test: {
    include: [
      "packages/*/src/**/*.test.ts",
      "packages/policy/*/src/**/*.test.ts",
      "apps/web/src/**/*.test.{ts,tsx}",
      "scripts/**/*.test.mjs",
    ],
    exclude: ["**/node_modules/**", "**/generated/**", "**/.next/**"],
    environment: "node",
    // next-auth imports `next/server` without an extension; let Vite resolve it instead of Node ESM.
    server: { deps: { inline: [/next-auth/, /@auth\/core/] } },
  },
});
