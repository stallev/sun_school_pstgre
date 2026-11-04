import { describe, expect, it } from "vitest";
import { USER_ROLE } from "@sunschool/domain";
import {
  applyPreviewNavAccess,
  canRealRolesAccessNavHref,
  countReachableNavLeaves,
  listNavLeafHrefs,
  resolveNavPageAllowedRoles,
} from "@/lib/shell/filter-nav-by-route-access";
import type { ResolvedNavItem } from "@/lib/shell/nav-resolver";

const teacherPreviewSample: ResolvedNavItem[] = [
  { key: "today", label: "Today", href: "/today" },
  {
    key: "lessons",
    label: "Lessons",
    children: [
      { key: "lessons-all", label: "All lessons", href: "/lessons" },
      { key: "check", label: "Check", href: "/check" },
    ],
  },
  {
    key: "group",
    label: "Group",
    children: [{ key: "group-roster", label: "Roster", href: "/group" }],
  },
  { key: "analytics", label: "Analytics", href: "/analytics" },
];

describe("resolveNavPageAllowedRoles (Q-2)", () => {
  it("allows admin on teacher list routes via page guard, not route-table alone", () => {
    expect(resolveNavPageAllowedRoles("/today")).toEqual([USER_ROLE.ADMIN, USER_ROLE.TEACHER]);
    expect(canRealRolesAccessNavHref([USER_ROLE.ADMIN], "/today")).toBe(true);
    expect(canRealRolesAccessNavHref([USER_ROLE.ADMIN], "/lessons")).toBe(true);
    expect(canRealRolesAccessNavHref([USER_ROLE.ADMIN], "/check")).toBe(true);
  });

  it("keeps /group teacher-only", () => {
    expect(canRealRolesAccessNavHref([USER_ROLE.ADMIN], "/group")).toBe(false);
    expect(canRealRolesAccessNavHref([USER_ROLE.ADMIN, USER_ROLE.TEACHER], "/group")).toBe(true);
  });
});

describe("applyPreviewNavAccess", () => {
  it("marks /group inactive for admin without TEACHER", () => {
    const preview = applyPreviewNavAccess(teacherPreviewSample, [USER_ROLE.ADMIN]);
    expect(listNavLeafHrefs(preview)).toEqual([
      { href: "/today" },
      { href: "/lessons" },
      { href: "/check" },
      { href: "/group", navDisabled: true },
      { href: "/analytics" },
    ]);
    expect(countReachableNavLeaves(preview)).toBe(4);
  });

  it("enables all teacher preview leaves when TEACHER is present", () => {
    const preview = applyPreviewNavAccess(teacherPreviewSample, [USER_ROLE.ADMIN, USER_ROLE.TEACHER]);
    expect(listNavLeafHrefs(preview).every((row) => !row.navDisabled)).toBe(true);
  });

  it("marks everything disabled for teacher-only user in admin preview menu", () => {
    const adminNav: ResolvedNavItem[] = [{ key: "school", label: "School", href: "/school" }];
    const preview = applyPreviewNavAccess(adminNav, [USER_ROLE.TEACHER]);
    expect(preview[0]).toMatchObject({ href: "/school", navDisabled: true });
  });
});
