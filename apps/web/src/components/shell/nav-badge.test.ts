import { describe, expect, it } from "vitest";
import { formatNavBadgeCount } from "./nav-badge";

describe("formatNavBadgeCount", () => {
  it("caps display at 99+", () => {
    expect(formatNavBadgeCount(100)).toBe("99+");
    expect(formatNavBadgeCount(99)).toBe("99");
  });
});
