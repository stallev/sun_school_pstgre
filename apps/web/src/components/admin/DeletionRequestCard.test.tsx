import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const componentDir = path.dirname(fileURLToPath(import.meta.url));

describe("DeletionRequestCard (P27-CU6)", () => {
  it("uses school-relative dates and requester fallback line", () => {
    const source = fs.readFileSync(path.join(componentDir, "DeletionRequestCard.tsx"), "utf8");
    expect(source).toMatch(/formatRelativeCalendarDay/);
    expect(source).toMatch(/requestedByRoleEmail/);
    expect(source).toMatch(/TermLabel/);
  });
});
