// Root Vitest config. Profile `lean` (docs/meta/project_quality_profile.md, D4/D7): unit tests in
// packages/domain and policy checks for S paths; no coverage thresholds; no e2e.
// Guide: docs/guidelines/testing/ai_testing_guidelines.md
import path from "node:path";
import { defineConfig, defineProject } from "vitest/config";

const resolveAlias = {
  "@": path.resolve(import.meta.dirname, "apps/web/src"),
  "server-only": path.resolve(import.meta.dirname, "apps/web/src/test/server-only-stub.ts"),
};

const INTEGRATION_GLOB = "**/*.integration.test.ts";
const runDbIntegration = process.env.RUN_DB_INTEGRATION === "1";

const unitProject = defineProject({
  resolve: { alias: resolveAlias },
  test: {
    name: "unit",
    include: [
      "packages/*/src/**/*.test.ts",
      "packages/policy/*/src/**/*.test.ts",
      "apps/web/src/**/*.test.{ts,tsx}",
      "scripts/**/*.test.mjs",
    ],
    exclude: ["**/node_modules/**", "**/generated/**", "**/.next/**", INTEGRATION_GLOB],
    environment: "node",
    server: { deps: { inline: [/next-auth/, /@auth\/core/] } },
  },
});

const projects = [unitProject];

if (runDbIntegration) {
  projects.push(
    defineProject({
      resolve: { alias: resolveAlias },
      test: {
        name: "db-seed-integration",
        include: [INTEGRATION_GLOB],
        exclude: ["**/node_modules/**", "**/generated/**", "**/.next/**"],
        environment: "node",
        fileParallelism: false,
        maxWorkers: 1,
        sequence: { concurrent: false },
      },
    }),
  );
}

export default defineConfig({
  test: { projects },
});
