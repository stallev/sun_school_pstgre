import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const achievementsDir = path.dirname(fileURLToPath(import.meta.url));

const readerFiles = [
  "award-manually.ts",
  "issue-penalty.ts",
  "load-pupil-penalty-form.server.ts",
  "evaluate-pupil.ts",
];

const forbiddenPatterns = [
  /\btierRow\.points\b/,
  /\bcatalogPenaltyPointsCap\b/,
  /row\.tiers\[0\]\?\.points\s*\?\?\s*row\.threshold/,
];

describe("achievement points readers grep gate", () => {
  for (const fileName of readerFiles) {
    it(`${fileName} does not read catalog points for caps outside group loader`, () => {
      const source = readFileSync(path.join(achievementsDir, fileName), "utf8");
      for (const pattern of forbiddenPatterns) {
        expect(source, pattern.toString()).not.toMatch(pattern);
      }
      expect(source).toContain("group-achievement-points.server");
    });
  }
});
