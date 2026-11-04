import { describe, expect, it } from "vitest";
import { ACCOUNT_STATUS, USER_ROLE } from "@sunschool/domain";
import { routeRoles } from "@sunschool/policy-edge";
import { checkRole } from "@sunschool/policy-server";
import {
  parseViewAsCookie,
  resolveViewAsRole,
  VIEW_AS_COOKIE_MAX_AGE_SECONDS,
  VIEW_AS_COOKIE_NAME,
} from "@/lib/shell/view-as-cookie";

describe("view-as cookie", () => {
  it("parses admin and teacher only", () => {
    expect(parseViewAsCookie(USER_ROLE.TEACHER)).toBe(USER_ROLE.TEACHER);
    expect(parseViewAsCookie(USER_ROLE.ADMIN)).toBe(USER_ROLE.ADMIN);
    expect(parseViewAsCookie("hacker")).toBeNull();
    expect(parseViewAsCookie(undefined)).toBeNull();
  });

  it("resolves preview role only for real admin", () => {
    expect(resolveViewAsRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN)).toBe(USER_ROLE.TEACHER);
    expect(resolveViewAsRole(USER_ROLE.ADMIN, USER_ROLE.ADMIN)).toBe(USER_ROLE.ADMIN);
    expect(resolveViewAsRole(USER_ROLE.TEACHER, USER_ROLE.TEACHER)).toBe(USER_ROLE.TEACHER);
    expect(resolveViewAsRole(USER_ROLE.ADMIN, USER_ROLE.TEACHER)).toBe(USER_ROLE.TEACHER);
    expect(resolveViewAsRole("bad", USER_ROLE.ADMIN)).toBe(USER_ROLE.ADMIN);
  });

  it("uses standard cookie contract", () => {
    expect(VIEW_AS_COOKIE_NAME).toBe("view_as");
    expect(VIEW_AS_COOKIE_MAX_AGE_SECONDS).toBe(2_592_000);
  });

  it("does not widen server access when view_as is teacher (S path)", () => {
    const adminOnly = {
      userId: "u1",
      status: ACCOUNT_STATUS.ACTIVE,
      roles: [USER_ROLE.ADMIN] as const,
    };
    const groupRoles = routeRoles("/group");
    expect(groupRoles).toBeTruthy();
    expect(checkRole(adminOnly, groupRoles!)).toEqual({ allowed: false, reason: "FORBIDDEN" });
  });
});
