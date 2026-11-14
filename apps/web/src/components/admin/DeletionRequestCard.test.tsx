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

  it("places the action hint next to the buttons, never inside them (P29-T37)", () => {
    const source = fs.readFileSync(path.join(componentDir, "DeletionRequestCard.tsx"), "utf8");
    expect(source.indexOf("deletionActionHint.hint")).toBeLessThan(source.indexOf("<DeletionTakeButton"));
    const take = fs.readFileSync(path.join(componentDir, "DeletionTakeButton.client.tsx"), "utf8");
    expect(take).not.toMatch(/TermLabel/);
  });
});
