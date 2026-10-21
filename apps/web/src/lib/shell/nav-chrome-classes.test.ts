import { describe, expect, it } from "vitest";
import { shellTopNavTriggerClass } from "./nav-chrome-classes";

describe("shellTopNavTriggerClass", () => {
  it("idle topnav trigger is not primary-filled", () => {
    const classes = shellTopNavTriggerClass({ isActive: false, isOpen: false });
    expect(classes).not.toContain("bg-cobalt-ink");
    expect(classes).toContain("h-9");
  });
});
