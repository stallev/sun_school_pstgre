import { describe, expect, it } from "vitest";
import { ACCOUNT_STATUS, USER_ROLE } from "@sunschool/domain";
import { homeRouteFor } from "./home-route";
import { isCanonicalRoute, routeRoles } from "./route-table";

describe("homeRouteFor", () => {
  it("maps every status (authorization_matrix §6)", () => {
    expect(homeRouteFor(ACCOUNT_STATUS.REGISTRATION, [])).toBe("/register");
    expect(homeRouteFor(ACCOUNT_STATUS.REQUEST_PENDING, [])).toBe("/pending");
    expect(homeRouteFor(ACCOUNT_STATUS.REJECTED, [])).toBe("/pending");
    expect(homeRouteFor(ACCOUNT_STATUS.ACTIVE, [USER_ROLE.TEACHER])).toBe("/today");
    expect(homeRouteFor(ACCOUNT_STATUS.ACTIVE, [USER_ROLE.ADMIN])).toBe("/school");
    expect(homeRouteFor(ACCOUNT_STATUS.ACTIVE, [USER_ROLE.TEACHER, USER_ROLE.ADMIN])).toBe("/school");
    expect(homeRouteFor(ACCOUNT_STATUS.ACTIVE, [])).toBe("/profile");
    expect(homeRouteFor(ACCOUNT_STATUS.DISABLED, [])).toBe("/login");
    expect(homeRouteFor(ACCOUNT_STATUS.DELETED, [])).toBe("/login");
    expect(homeRouteFor(undefined, [])).toBe("/login");
  });
});

describe("route table (canonical_routes §4, authorization_matrix §8)", () => {
  it("knows the canonical routes and rejects post-MVP / unknown ones", () => {
    for (const path of ["/login", "/privacy", "/register", "/pending", "/profile", "/today", "/lessons", "/lessons/new", "/lessons/42", "/lessons/42/edit", "/lessons/42/table", "/lessons/42/check", "/check", "/group", "/group/points", "/calendar", "/rating", "/verses", "/analytics", "/analytics/pupils/7", "/bricks", "/school", "/approvals", "/users", "/users/9", "/people", "/groups", "/groups/3", "/groups/3/points", "/year", "/deletions", "/audit", "/settings"]) {
      expect(isCanonicalRoute(path), path).toBe(true);
    }
    for (const path of ["/achievements", "/child", "/family", "/verse/1", "/users/1/extra", "/nope", "https://evil.example/", "//evil.example"]) {
      expect(isCanonicalRoute(path), path).toBe(false);
    }
  });

  it("encodes the role requirements of §8", () => {
    expect(routeRoles("/today")).toEqual([USER_ROLE.TEACHER]);
    expect(routeRoles("/users/5")).toEqual([USER_ROLE.ADMIN]);
    expect(routeRoles("/lessons")).toEqual([USER_ROLE.TEACHER]);
    expect(routeRoles("/lessons/new")).toEqual([USER_ROLE.ADMIN, USER_ROLE.TEACHER]);
    expect(routeRoles("/lessons/42/check")).toEqual([USER_ROLE.ADMIN, USER_ROLE.TEACHER]);
    expect(routeRoles("/calendar")).toEqual([USER_ROLE.ADMIN, USER_ROLE.TEACHER]);
    expect(routeRoles("/group/points")).toEqual([USER_ROLE.TEACHER]);
    expect(routeRoles("/groups/3/points")).toEqual([USER_ROLE.ADMIN]);
    expect(routeRoles("/login")).toBeNull();
  });
});
