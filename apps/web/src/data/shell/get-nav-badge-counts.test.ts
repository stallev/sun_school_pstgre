import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACCESS_REQUEST_STATUS,
  ACCOUNT_STATUS,
  DELETION_REQUEST_STATUS,
  USER_ROLE,
} from "@sunschool/domain";
import { NAV_BADGE_SLOT } from "@/components/shell/nav-config";

const accessRequest = { count: vi.fn() };
const deletionRequest = { count: vi.fn() };

vi.mock("@/lib/db.server", () => ({
  getPrisma: vi.fn(async () => ({ accessRequest, deletionRequest })),
}));

import { getNavBadgeCounts } from "./get-nav-badge-counts.server";

const adminContext = {
  userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  status: ACCOUNT_STATUS.ACTIVE,
  roles: [USER_ROLE.ADMIN],
};

describe("getNavBadgeCounts", () => {
  beforeEach(() => {
    accessRequest.count.mockReset();
    deletionRequest.count.mockReset();
  });

  it("returns empty counts for non-admin", async () => {
    const counts = await getNavBadgeCounts({
      userId: adminContext.userId,
      status: ACCOUNT_STATUS.ACTIVE,
      roles: [USER_ROLE.TEACHER],
    });
    expect(counts).toEqual({});
    expect(accessRequest.count).not.toHaveBeenCalled();
  });

  it("maps approvals to pending requests and people group to requests plus open deletions", async () => {
    accessRequest.count.mockResolvedValue(4);
    deletionRequest.count.mockResolvedValue(2);

    const counts = await getNavBadgeCounts(adminContext);

    expect(accessRequest.count).toHaveBeenCalledWith({
      where: { status: ACCESS_REQUEST_STATUS.PENDING },
    });
    expect(deletionRequest.count).toHaveBeenCalledWith({
      where: {
        status: { in: [DELETION_REQUEST_STATUS.NEW, DELETION_REQUEST_STATUS.IN_PROGRESS] },
      },
    });
    expect(counts[NAV_BADGE_SLOT.APPROVALS]).toBe(4);
    expect(counts[NAV_BADGE_SLOT.PEOPLE_GROUP]).toBe(6);
  });
});
