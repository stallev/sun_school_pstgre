import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const uiDir = path.dirname(fileURLToPath(import.meta.url));

describe("SegmentedControl fit (P24-CU2 §5.2)", () => {
  it("uses gap-1.5 and min-w-14 on chips when fit", () => {
    const source = fs.readFileSync(path.join(uiDir, "segmented-control.tsx"), "utf8");
    expect(source).toContain("inline-flex max-w-full flex-wrap gap-1.5");
    expect(source).toMatch(/fit && "min-w-14"/);
  });
});

describe("SegmentedControl (P14-CU3)", () => {
  it("matches SEG_ON / SEG_OFF / CHIP parity classes", () => {
    const chipSource = fs.readFileSync(
      path.join(uiDir, "../../lib/ui/segmented-chip-classes.ts"),
      "utf8",
    );
    const source = fs.readFileSync(path.join(uiDir, "segmented-control.tsx"), "utf8");
    expect(chipSource).toMatch(/\?\s*"border-cobalt-ink bg-cobalt-soft font-bold text-cobalt-ink hover:bg-cobalt-soft"/);
    expect(chipSource).toMatch(/\bh-9\b/);
    expect(chipSource).toContain("after:-inset-y-1");
    expect(chipSource).toMatch(/:\s*"border-muted bg-surface text-ink hover:border-ink-2"/);
    expect(chipSource).toMatch(/transition-\[background-color,border-color,color/);
    expect(source).toContain("segmentedChipClassName");
    expect(source).toContain('"radio" | "toggle"');
    expect(source).toContain('fit?: boolean');
    expect(source).toContain("fit = true");
    expect(source).toContain("aria-pressed");
  });
});

describe("P14-CU8 RecordCard analytics type (redesign §3.5)", () => {
  it("uses text-[1.25rem] for analytics card body, not legacy 1.3125rem", () => {
    const source = fs.readFileSync(
      path.join(uiDir, "../patterns/RecordCard.tsx"),
      "utf8",
    );
    expect(source).toMatch(/isAnalytics[\s\S]*text-\[1\.25rem\][\s\S]*leading-snug/);
    expect(source).not.toContain("1.3125rem");
  });
});
