import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CONTROL_HEIGHTS, SPACE_TOKENS } from "./tokens";

const globalsCss = fs.readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../app/globals.css"),
  "utf8",
);

describe("spacing tokens (P29-T2, ADR-022 §4.2)", () => {
  it("defines all 7 --space-* tokens in :root", () => {
    expect(SPACE_TOKENS).toHaveLength(7);
    for (const token of SPACE_TOKENS) {
      const declared = new RegExp(`${token.variable}:\\s*${token.rem[0]}rem;`);
      expect(globalsCss, token.variable).toMatch(declared);
    }
  });

  it("maps every token into @theme inline as --spacing-*", () => {
    for (const token of SPACE_TOKENS) {
      expect(globalsCss, token.theme).toContain(`${token.theme}: var(${token.variable});`);
    }
  });

  it("grows card / section / page-x with the viewport", () => {
    expect(globalsCss).toMatch(/min-width: 48rem[\s\S]*--space-card: 1\.35rem/);
    expect(globalsCss).toMatch(/min-width: 64rem[\s\S]*--space-page-x: 1\.8rem/);
  });

  it("keeps px labels equal to rem × 18", () => {
    for (const token of SPACE_TOKENS) {
      token.rem.forEach((rem, index) => {
        expect(Number(token.px[index])).toBeCloseTo(Number(rem) * 18, 1);
      });
    }
  });
});

describe("control heights (P29-T4, ADR-022 §4.3)", () => {
  it("declares 2.25 / 2 / 2.75 rem in :root", () => {
    for (const height of CONTROL_HEIGHTS) {
      expect(globalsCss).toMatch(new RegExp(`${height.variable}:\\s*${height.rem}rem;`));
    }
  });
});
