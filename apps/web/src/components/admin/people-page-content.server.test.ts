import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const adminDir = path.dirname(fileURLToPath(import.meta.url));

describe("PeoplePageContent (P27-CU6)", () => {
  it("adds consent paper hint above the pupil list", () => {
    const source = fs.readFileSync(path.join(adminDir, "PeoplePageContent.server.tsx"), "utf8");
    expect(source).toMatch(/consent_paper/);
    expect(source).toMatch(/TermLabel/);
    expect(source).toMatch(/pupil_states/);
  });
});
