import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const uiDir = path.dirname(fileURLToPath(import.meta.url));

describe("P14-CU2 blocker regressions", () => {
  it("ScoreCell trigger uses D-9 compact h-9 and text-base (not h-8 / text-sm)", () => {
    const source = fs.readFileSync(path.join(uiDir, "score-cell.tsx"), "utf8");
    expect(source).toMatch(/triggerClass[\s\S]*h-9/);
    expect(source).toMatch(/triggerClass[\s\S]*text-base/);
    expect(source).not.toMatch(/triggerClass[\s\S]*\bh-8\b/);
    expect(source).not.toMatch(/triggerClass[\s\S]*\btext-sm\b/);
  });

  it("TableCell uses uniform px-3 py-3 per P-31 (no first/last px-5)", () => {
    const source = fs.readFileSync(path.join(uiDir, "table.tsx"), "utf8");
    const cellBlock = source.match(/function TableCell[\s\S]*?function TableCaption/)?.[0] ?? "";
    expect(cellBlock).toContain("px-3 py-3");
    expect(cellBlock).not.toContain("first:px-5");
    expect(cellBlock).not.toContain("last:px-5");
  });
});
