import { describe, expect, it } from "vitest";
import { USER_ROLE } from "@sunschool/domain";
import { NAV_BY_ROLE } from "@/components/shell/nav-config";
import {
  resolveActiveNavKey,
  resolveNavDefs,
  resolveShellRole,
} from "@/lib/shell/nav-resolver";

const leafHrefs = (role: typeof USER_ROLE.ADMIN | typeof USER_ROLE.TEACHER): string[] => {
  const hrefs: string[] = [];
  for (const entry of NAV_BY_ROLE[role]) {
    if ("children" in entry) {
      for (const child of entry.children) hrefs.push(child.href);
    } else {
      hrefs.push(entry.href);
    }
  }
  return hrefs;
};

describe("resolveShellRole", () => {
  it("prefers admin when both roles are held", () => {
    expect(resolveShellRole([USER_ROLE.TEACHER, USER_ROLE.ADMIN])).toBe(USER_ROLE.ADMIN);
  });

  it("returns teacher when only teacher is held", () => {
    expect(resolveShellRole([USER_ROLE.TEACHER])).toBe(USER_ROLE.TEACHER);
  });
});

describe("resolveNavDefs", () => {
  it("matches UX-02 teacher routes", () => {
    expect(leafHrefs(USER_ROLE.TEACHER)).toEqual([
      "/today",
      "/lessons",
      "/check",
      "/verses",
      "/group",
      "/bricks",
      "/rating",
      "/calendar",
      "/analytics",
    ]);
  });

  it("matches UX-02 admin routes", () => {
    expect(leafHrefs(USER_ROLE.ADMIN)).toEqual([
      "/school",
      "/analytics",
      "/rating",
      "/audit",
      "/approvals",
      "/users",
      "/people",
      "/deletions",
      "/bricks",
      "/groups",
      "/year",
      "/calendar",
      "/verses",
      "/settings",
    ]);
  });

  it("does not expose admin items to teacher role", () => {
    const teacher = resolveNavDefs(USER_ROLE.TEACHER).flatMap((entry) =>
      "children" in entry ? entry.children.map((c) => c.href) : [entry.href],
    );
    expect(teacher).not.toContain("/users");
    expect(teacher).not.toContain("/approvals");
  });
});

describe("resolveActiveNavKey", () => {
  it("maps the lessons list to the all-lessons leaf", () => {
    expect(resolveActiveNavKey("/lessons", USER_ROLE.TEACHER)).toBe("lessons-all");
  });

  it("maps lesson detail paths to the lessons group", () => {
    expect(resolveActiveNavKey("/lessons/abc-123", USER_ROLE.TEACHER)).toBe("lessons");
  });

  it("maps user profile path to users", () => {
    expect(resolveActiveNavKey("/users/u1", USER_ROLE.ADMIN)).toBe("users");
  });
});
