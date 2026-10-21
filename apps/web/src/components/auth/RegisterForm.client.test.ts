import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));

/**
 * access_and_registration_spec §7.1: page title (PageHeader h1) is separate;
 * reject-reason block shows only the reason — no duplicate titleResubmit in Banner.
 */
describe("RegisterForm resubmit reject banner", () => {
  it("does not pass titleResubmit to Banner (spec §7.1)", () => {
    const source = readFileSync(join(dir, "RegisterForm.client.tsx"), "utf8");
    expect(source).not.toMatch(/title=\{messages\.register\.titleResubmit\}/);
    expect(source).toMatch(/rejectReason\s*\?\s*\(\s*\n\s*<Banner tone="error">/);
  });
});
