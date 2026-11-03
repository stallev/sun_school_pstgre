import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const uiDir = path.dirname(fileURLToPath(import.meta.url));

describe("ScorePad inline 0–10 (P24-CU2)", () => {
  it("uses compact h-9 chips and radiogroup arrows for inline max 10", () => {
    const source = fs.readFileSync(path.join(uiDir, "score-pad.tsx"), "utf8");
    expect(source).toMatch(/layout === "inline"\s*\?\s*"h-9 min-w-9 px-1 lg:min-w-0 lg:flex-1"/);
    expect(source).toContain("lg:flex-nowrap lg:gap-1");
    expect(source).toContain('role="radiogroup"');
    expect(source).toContain("ArrowRight");
    expect(source).toMatch(/length: max \+ 1/);
  });
});
