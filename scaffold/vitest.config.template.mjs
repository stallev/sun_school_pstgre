// Root Vitest config — P5 copies it to `vitest.config.mjs` when the quality profile is `lean` or higher.
// Scope per level: docs/meta/project_quality_profile.md (D4); guide: docs/guidelines/testing/ai_testing_guidelines.md
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // One project per workspace (packages/policy is a folder of two packages, not a package itself).
    // Add a vitest config inside a package only if it needs its own environment.
    projects: ["packages/domain", "packages/db", "packages/policy/edge", "packages/policy/server", "apps/web"],
    coverage: {
      provider: "v8",
      include: ["packages/**/src/**", "apps/web/src/data/**"],
      exclude: ["**/*.test.*", "**/generated/**"],
      // Thresholds per profile D4 — keep the block for your level, delete the others.
      // standard:
      thresholds: {
        "packages/domain/src/**": { lines: 60 },
        "packages/policy/**/src/**": { lines: 60 },
      },
      // strict:
      // thresholds: {
      //   "packages/domain/src/**": { lines: 80 },
      //   "packages/policy/**/src/**": { lines: 80 },
      //   "apps/web/src/data/**": { lines: 60 },
      // },
      // lean: no thresholds — remove the `thresholds` key.
    },
  },
});
