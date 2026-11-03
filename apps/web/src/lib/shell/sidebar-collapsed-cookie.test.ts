import { describe, expect, it } from "vitest";
import {
  parseSidebarCollapsedCookie,
  SIDEBAR_COLLAPSED_COOKIE_NAME,
} from "./sidebar-collapsed-cookie";

describe("sidebar-collapsed-cookie", () => {
  it("uses the canonical cookie name", () => {
    expect(SIDEBAR_COLLAPSED_COOKIE_NAME).toBe("sidebar_collapsed");
  });

  it("parses collapsed only for value 1", () => {
    expect(parseSidebarCollapsedCookie(undefined)).toBe(false);
    expect(parseSidebarCollapsedCookie("0")).toBe(false);
    expect(parseSidebarCollapsedCookie("true")).toBe(false);
    expect(parseSidebarCollapsedCookie("1")).toBe(true);
  });
});
