import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const uiDir = path.dirname(fileURLToPath(import.meta.url));

describe("Button sizes (P24-CU3 / ADR-017 §4)", () => {
  it("defines default h-9, field h-10, touch h-11, icon size-9 — no compact", () => {
    const source = fs.readFileSync(path.join(uiDir, "button.tsx"), "utf8");
    expect(source).toMatch(/default:[\s\S]*\bh-9\b/);
    expect(source).toMatch(/field:[\s\S]*\bh-10\b/);
    expect(source).toMatch(/touch:[\s\S]*\bh-11\b/);
    expect(source).toMatch(/icon: cn\("size-9"/);
    expect(source).not.toMatch(/\bcompact:\s/);
    expect(source).toContain("after:-inset-y-1");
  });
});
