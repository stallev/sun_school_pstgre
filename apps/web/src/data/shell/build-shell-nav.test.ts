import { describe, expect, it } from "vitest";
import { USER_ROLE } from "@sunschool/domain";
import { filterNavItemsByRealAccess } from "@/lib/shell/filter-nav-by-route-access";
import type { ResolvedNavItem } from "@/lib/shell/nav-resolver";

const teacherSampleNav: ResolvedNavItem[] = [
  { key: "today", label: "Today", href: "/today" },
  {
    key: "group",
    label: "Group",
    children: [
      { key: "group-roster", label: "Roster", href: "/group" },
      { key: "bricks", label: "Bricks", href: "/bricks" },
    ],
  },
  { key: "analytics", label: "Analytics", href: "/analytics" },
];

describe("filterNavItemsByRealAccess", () => {
  it("drops teacher-only /group for admin without TEACHER", () => {
    const filtered = filterNavItemsByRealAccess(teacherSampleNav, [USER_ROLE.ADMIN]);
    const groupGroup = filtered.find((item) => item.key === "group");
    expect(groupGroup && "children" in groupGroup ? groupGroup.children.map((c) => c.href) : []).toEqual([
      "/bricks",
    ]);
    expect(filtered.some((item) => item.key === "today")).toBe(false);
  });

  it("keeps teacher routes when TEACHER role is present", () => {
    const filtered = filterNavItemsByRealAccess(teacherSampleNav, [USER_ROLE.ADMIN, USER_ROLE.TEACHER]);
    expect(filtered.length).toBe(teacherSampleNav.length);
    const groupGroup = filtered.find((item) => item.key === "group");
    expect(groupGroup && "children" in groupGroup ? groupGroup.children.length : 0).toBe(2);
  });

  it("returns empty when nothing is reachable", () => {
    const adminOnlyNav: ResolvedNavItem[] = [
      { key: "users", label: "Users", href: "/users" },
    ];
    expect(filterNavItemsByRealAccess(adminOnlyNav, [USER_ROLE.TEACHER])).toEqual([]);
  });
});
