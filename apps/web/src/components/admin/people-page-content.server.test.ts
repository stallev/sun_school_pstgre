import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const adminDir = path.dirname(fileURLToPath(import.meta.url));

describe("PeoplePageContent (P26-CU5)", () => {
  it("scopes legacy consent panel to the legacy tab", () => {
    const source = fs.readFileSync(path.join(adminDir, "PeoplePageContent.server.tsx"), "utf8");
    expect(source).toMatch(/isLegacyTab[\s\S]*LegacyConsentList/);
    expect(source).toMatch(/legacyCountLink/);
    expect(source).toMatch(/ShowMore/);
    expect(source).toMatch(/PeopleGroupFilter/);
  });
});
