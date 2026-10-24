import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const uiDir = path.dirname(fileURLToPath(import.meta.url));

describe("SegmentedControl (P14-CU3)", () => {
  it("matches SEG_ON / SEG_OFF / CHIP parity classes", () => {
    const source = fs.readFileSync(path.join(uiDir, "segmented-control.tsx"), "utf8");
    expect(source).toMatch(/\?\s*"border-cobalt-ink bg-cobalt-soft font-bold text-cobalt-ink hover:bg-cobalt-soft"/);
    expect(source).toMatch(/:\s*"border-muted bg-surface text-ink hover:border-ink-2"/);
    expect(source).toMatch(/transition-\[background-color,border-color,color\]/);
    expect(source).toContain('"radio" | "toggle"');
    expect(source).toContain('size?: "default" | "compact"');
    expect(source).toContain("aria-pressed");
  });
});
