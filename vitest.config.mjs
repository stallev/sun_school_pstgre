// Root Vitest config. Profile `lean` (docs/meta/project_quality_profile.md, D4/D7): unit tests in
// packages/domain and policy checks for S paths; no coverage thresholds; no e2e.
// Guide: docs/guidelines/testing/ai_testing_guidelines.md
import path from "node:path";
import { defineConfig, defineProject } from "vitest/config";

const resolveAlias = {
  "@": path.resolve(import.meta.dirname, "apps/web/src"),
  "server-only": path.resolve(import.meta.dirname, "apps/web/src/test/server-only-stub.ts"),
};

const DB_SEED_INTEGRATION = "packages/db/src/seed/**/*.integration.test.ts";

export default defineConfig({
  test: {
    projects: [
      defineProject({
        resolve: { alias: resolveAlias },
        test: {
          name: "unit",
          include: [
            "packages/*/src/**/*.test.ts",
            "packages/policy/*/src/**/*.test.ts",
            "apps/web/src/**/*.test.{ts,tsx}",
            "scripts/**/*.test.mjs",
          ],
          exclude: ["**/node_modules/**", "**/generated/**", "**/.next/**", DB_SEED_INTEGRATION],
          environment: "node",
          server: { deps: { inline: [/next-auth/, /@auth\/core/] } },
        },
      }),
      defineProject({
        resolve: { alias: resolveAlias },
        test: {
          name: "db-seed-integration",
          include: [DB_SEED_INTEGRATION],
          exclude: ["**/node_modules/**", "**/generated/**"],
          environment: "node",
          fileParallelism: false,
          maxWorkers: 1,
          sequence: { concurrent: false },
        },
      }),
    ],
  },
});
