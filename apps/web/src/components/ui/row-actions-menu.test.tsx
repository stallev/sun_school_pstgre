import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const uiDir = path.dirname(fileURLToPath(import.meta.url));

describe("RowActionsMenu (P25-CU7)", () => {
  it("uses Base UI menu with accessible trigger and popup", () => {
    const source = fs.readFileSync(path.join(uiDir, "row-actions-menu.tsx"), "utf8");
    expect(source).toContain("@base-ui/react/menu");
    expect(source).toContain('aria-haspopup="menu"');
    expect(source).toContain("Menu.Portal");
    expect(source).toContain("RowActionsMenuItem");
    expect(source).toContain("destructive");
    expect(source).toContain("shadow-float");
  });
});
