import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "ViewAsBadge.tsx"),
  "utf8",
);

describe("ViewAsBadge (P25-CU9)", () => {
  it("stays visible below sm so view-mode label shows on narrow header", () => {
    expect(source).not.toMatch(/\bhidden\b[\s\S]*\bsm:inline\b/);
    expect(source).toMatch(/className="inline shrink-0/);
  });
});
