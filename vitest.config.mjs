// Root Vitest config. Profile `lean` (docs/meta/project_quality_profile.md, D4/D7): unit tests in
// packages/domain and policy checks for S paths; no coverage thresholds; no e2e.
// Guide: docs/guidelines/testing/ai_testing_guidelines.md
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "packages/*/src/**/*.test.ts",
      "packages/policy/*/src/**/*.test.ts",
      "apps/web/src/**/*.test.{ts,tsx}",
    ],
    exclude: ["**/node_modules/**", "**/generated/**", "**/.next/**"],
    environment: "node",
  },
});
