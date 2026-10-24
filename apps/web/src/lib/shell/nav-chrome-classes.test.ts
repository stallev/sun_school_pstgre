import { describe, expect, it } from "vitest";
import { SHELL_NAV_DROPDOWN_PANEL } from "./nav-chrome-classes";

describe("SHELL_NAV_DROPDOWN_PANEL", () => {
  it("uses float shadow token, not ad-hoc shadow", () => {
    expect(SHELL_NAV_DROPDOWN_PANEL).toContain("shadow-float");
    expect(SHELL_NAV_DROPDOWN_PANEL).not.toMatch(/shadow-\[/);
  });
});
