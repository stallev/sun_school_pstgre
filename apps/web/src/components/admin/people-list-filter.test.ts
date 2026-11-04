import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const adminDir = path.dirname(fileURLToPath(import.meta.url));

describe("PeopleListFilterNav typography (P25-CU7)", () => {
  it("filter tabs use text-sm, not forbidden text-[0.9375rem]", () => {
    const source = fs.readFileSync(path.join(adminDir, "PeopleListFilter.tsx"), "utf8");
    expect(source).not.toContain("text-[0.9375rem]");
    expect(source).toMatch(/CustomLink[\s\S]*text-sm/);
  });
});

describe("PeopleListFilterNav (P27-CU6)", () => {
  it("UNASSIGNED/INACTIVE tabs use filter labels with pupil_states hint text, not hint.term", () => {
    const source = fs.readFileSync(path.join(adminDir, "PeopleListFilter.tsx"), "utf8");
    expect(source).toMatch(/term=\{nonEmptyTerm\(label\)\}/);
    expect(source).toMatch(/hint=\{hint\.hint\}/);
    expect(source).not.toMatch(/term=\{nonEmptyTerm\(hint\.term\)\}/);
  });
});
