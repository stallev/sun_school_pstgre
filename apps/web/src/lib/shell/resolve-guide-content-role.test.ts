import { describe, expect, it } from "vitest";
import { USER_ROLE } from "@sunschool/domain";

import { resolveGuideContentRole } from "@/lib/shell/resolve-guide-content-role";

describe("resolveGuideContentRole", () => {
  it("matches resolveViewAsRole for instruction text", () => {
    expect(resolveGuideContentRole(USER_ROLE.ADMIN, USER_ROLE.TEACHER)).toBe("teacher");
    expect(resolveGuideContentRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN)).toBe("teacher");
    expect(resolveGuideContentRole(USER_ROLE.ADMIN, USER_ROLE.ADMIN)).toBe("admin");
    expect(resolveGuideContentRole(undefined, USER_ROLE.PARENT)).toBe("parent");
    expect(resolveGuideContentRole("bad", USER_ROLE.ADMIN)).toBe("admin");
  });
});
