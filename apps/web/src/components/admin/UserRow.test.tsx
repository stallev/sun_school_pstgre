import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const componentDir = path.dirname(fileURLToPath(import.meta.url));
const readSource = (file: string) => fs.readFileSync(path.join(componentDir, file), "utf8");

describe("UserRow (P29-CU6)", () => {
  it("disambiguates homonyms and uses admin without name label", () => {
    const source = readSource("UserRow.tsx");
    expect(source).toMatch(/resolveUserListPrimaryName/);
    expect(source).toMatch(/disambiguator/);
  });

  it("renders only the status value in a row: no term word and no hint button", () => {
    const source = readSource("UserRow.tsx");
    expect(source).not.toMatch(/TermLabel|TermHint|statusHint/);
    expect(source).toMatch(/<StatusText tone=\{statusTone\(row\.status\)\}>\{statusLabel\}<\/StatusText>/);
  });

  it("keeps the single statuses hint at the tabs group", () => {
    expect(readSource("UsersStatusFilter.tsx")).toMatch(/<TermLabel/);
  });
});
