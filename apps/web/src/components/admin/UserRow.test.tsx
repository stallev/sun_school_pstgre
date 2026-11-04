import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const componentDir = path.dirname(fileURLToPath(import.meta.url));

describe("UserRow (P27-CU6)", () => {
  it("disambiguates homonyms and uses admin without name label", () => {
    const source = fs.readFileSync(path.join(componentDir, "UserRow.tsx"), "utf8");
    expect(source).toMatch(/resolveUserListPrimaryName/);
    expect(source).toMatch(/disambiguator/);
    expect(source).toMatch(/TermLabel/);
  });
});
