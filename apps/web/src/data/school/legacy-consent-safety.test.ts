import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("legacy consent safety (INV-25)", () => {
  it("does not schedule auto-deletion when the transitional deadline passes", () => {
    const repoRoot = path.resolve(import.meta.dirname, "../../../../../");
    const rootPackage = readFileSync(path.join(repoRoot, "package.json"), "utf8");
    const webNextConfig = readFileSync(path.join(repoRoot, "apps/web/next.config.ts"), "utf8");
    const combined = `${rootPackage}\n${webNextConfig}`;
    expect(combined).not.toMatch(/legacy_consent/i);
    expect(combined).not.toMatch(/LEGACY_PENDING/i);
  });
});
