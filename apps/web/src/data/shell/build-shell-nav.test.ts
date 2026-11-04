import { describe, expect, it, vi } from "vitest";
import { ACCOUNT_STATUS, USER_ROLE } from "@sunschool/domain";
import { buildShellNav } from "@/data/shell/build-shell-nav.server";
import { listNavLeafHrefs } from "@/lib/shell/filter-nav-by-route-access";
import { resolveNavItems } from "@/lib/shell/nav-resolver";

vi.mock("@/data/shell/read-product-feature-flags.server", () => ({
  readProductFeatureFlags: vi.fn(async () => ({
    achievementsEnabled: true,
    parentsEnabled: false,
  })),
}));

vi.mock("@/lib/db.server", () => ({
  getPrisma: vi.fn(async () => ({})),
}));

vi.mock("@/lib/messages/get-dictionary", () => ({
  getDictionary: vi.fn(async () => ({})),
  getMessage: (_dict: unknown, key: string) => key,
}));

const label = (key: string) => key;

describe("buildShellNav preview (P26-T1)", () => {
  it("shows reachable and disabled teacher items for admin in view-as teacher mode", async () => {
    const teacherMenu = resolveNavItems(USER_ROLE.TEACHER, label);
    const context = {
      userId: "admin-1",
      status: ACCOUNT_STATUS.ACTIVE,
      roles: [USER_ROLE.ADMIN],
    };
    const payload = await buildShellNav(context, "ru", {
      appEnv: "dev",
      viewAsRole: USER_ROLE.TEACHER,
    });
    expect(payload.previewNavItems?.length).toBe(teacherMenu.length);
    const leaves = listNavLeafHrefs(payload.previewNavItems ?? []);
    expect(leaves.find((row) => row.href === "/today")?.navDisabled).toBeFalsy();
    expect(leaves.find((row) => row.href === "/lessons")?.navDisabled).toBeFalsy();
    expect(leaves.find((row) => row.href === "/check")?.navDisabled).toBeFalsy();
    expect(leaves.find((row) => row.href === "/group")?.navDisabled).toBe(true);
    expect(payload.previewNavEmptyHint).toBeUndefined();
  });
});
