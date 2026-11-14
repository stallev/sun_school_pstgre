import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const uiDir = path.dirname(fileURLToPath(import.meta.url));

describe("SegmentedControl fit and gap (P24-CU2 §5.2, P29-T20/T21)", () => {
  it("uses gap-chip between chips and min-w-14 on chips when fit", () => {
    const source = fs.readFileSync(path.join(uiDir, "segmented-control.tsx"), "utf8");
    expect(source).toContain("inline-flex max-w-full flex-wrap");
    expect(source).toContain('"gap-chip"');
    expect(source).toMatch(/fit && "min-w-14"/);
  });

  it("grouped: one shared border, dividers, no inner gap, radiogroup container", () => {
    const source = fs.readFileSync(path.join(uiDir, "segmented-control.tsx"), "utf8");
    expect(source).toContain("grouped?: boolean");
    expect(source).toContain("divide-x divide-line-strong overflow-hidden rounded-lg border");
    expect(source).toContain('"rounded-none border-0"');
    expect(source).toContain('"radiogroup"');
  });
});

describe("Chip and link-button height (P29-T19)", () => {
  it("chips are h-9 (40.5 px, above the 36 px floor)", () => {
    const chipSource = fs.readFileSync(
      path.join(uiDir, "../../lib/ui/segmented-chip-classes.ts"),
      "utf8",
    );
    expect(chipSource).toMatch(/\bh-9\b/);
  });

  it("CustomLink action variant has min-h-8 hit area", () => {
    const source = fs.readFileSync(path.join(uiDir, "custom-link.tsx"), "utf8");
    expect(source).toContain('variant === "action"');
    expect(source).toContain("min-h-8");
  });

  it("SegmentedControlLinks uses gap-chip", () => {
    const source = fs.readFileSync(path.join(uiDir, "segmented-control-links.tsx"), "utf8");
    expect(source).toContain("gap-chip");
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
