import { describe, expect, it } from "vitest";
import { USER_ROLE } from "@sunschool/domain";
import { NAV_BY_ROLE, isNavGroup } from "@/components/shell/nav-config";
import { getNavIcon } from "@/components/shell/nav-icons";

const navKeys = (): string[] => {
  const keys = new Set<string>();
  for (const role of [USER_ROLE.TEACHER, USER_ROLE.ADMIN]) {
    for (const entry of NAV_BY_ROLE[role]) {
      keys.add(entry.key);
      if (isNavGroup(entry)) {
        for (const child of entry.children) keys.add(child.key);
      }
    }
  }
  return [...keys];
};

describe("getNavIcon", () => {
  it("gives every teacher and admin nav item an icon", () => {
    for (const key of navKeys()) {
      expect(getNavIcon(key), key).not.toBeNull();
    }
  });
});
