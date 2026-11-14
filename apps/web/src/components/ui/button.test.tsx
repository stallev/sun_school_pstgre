import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const uiDir = path.dirname(fileURLToPath(import.meta.url));

describe("Button sizes (P29-CU2 / ADR-022 §4.3)", () => {
  it("defines default h-9, compact h-8, touch h-11, icon size-9 — no field", () => {
    const source = fs.readFileSync(path.join(uiDir, "button.tsx"), "utf8");
    expect(source).toMatch(/default:[\s\S]*\bh-9\b/);
    expect(source).toMatch(/compact:[\s\S]*\bh-8\b/);
    expect(source).not.toMatch(/\bfield:\s/);
    expect(source).not.toMatch(/\bh-10\b/);
    expect(source).toContain("gap-chip");
    expect(source).toMatch(/touch:[\s\S]*\bh-11\b/);
    expect(source).toMatch(/icon: cn\("size-9"/);
    expect(source).toContain("after:-inset-y-1");
  });
});
