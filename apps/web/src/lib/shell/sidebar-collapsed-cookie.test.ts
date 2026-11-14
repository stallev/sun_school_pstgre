import { describe, expect, it } from "vitest";
import {
  parseSidebarPreferenceCookie,
  SIDEBAR_COLLAPSED_COOKIE_NAME,
} from "./sidebar-collapsed-cookie";

describe("sidebar-collapsed-cookie", () => {
  it("uses the canonical cookie name", () => {
    expect(SIDEBAR_COLLAPSED_COOKIE_NAME).toBe("sidebar_collapsed");
  });

  it("maps 1 / 0 to an explicit choice", () => {
    expect(parseSidebarPreferenceCookie("1")).toBe("collapsed");
    expect(parseSidebarPreferenceCookie("0")).toBe("expanded");
  });

  it("treats missing or corrupt value as no choice", () => {
    expect(parseSidebarPreferenceCookie(undefined)).toBe("auto");
    expect(parseSidebarPreferenceCookie("")).toBe("auto");
    expect(parseSidebarPreferenceCookie("true")).toBe("auto");
    expect(parseSidebarPreferenceCookie("2")).toBe("auto");
  });
});
