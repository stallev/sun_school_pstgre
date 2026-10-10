// apps/web Playwright config — P5 copies it to `apps/web/playwright.config.ts` when the quality profile is `standard` or `strict`.
// Scope per level: docs/meta/project_quality_profile.md (D5); guide: docs/guidelines/testing/ai_testing_guidelines.md
import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.E2E_BASE_URL;
const isCi = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCi,
  // Retries only to capture a trace of a flaky run; the flake itself is a task to fix.
  retries: isCi ? 1 : 0,
  use: {
    baseURL: externalBaseUrl ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  // Mobile-first products: both viewports, matching the Design Lab checks (390px and md+).
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  // Against a production build locally / in CI; against a preview deployment when E2E_BASE_URL is set.
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "npm run build && npm run start",
        url: "http://localhost:3000",
        reuseExistingServer: !isCi,
        timeout: 180_000,
      },
});
