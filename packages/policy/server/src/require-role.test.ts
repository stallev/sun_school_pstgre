import { describe, expect, it } from "vitest";
import { ACCOUNT_STATUS, USER_ROLE, type AccountStatus, type UserRole } from "@sunschool/domain";
import { checkRole } from "./require-role";
import type { PolicySessionContext } from "./context";

const ctx = (roles: UserRole[], status: AccountStatus = ACCOUNT_STATUS.ACTIVE): PolicySessionContext => ({
  userId: "u1",
  status,
  roles,
});
const FORBIDDEN = { allowed: false, reason: "FORBIDDEN" } as const;

describe("checkRole (AZ-D3, AZ-D5)", () => {
  it("allows a holder of an allowed role", () => {
    expect(checkRole(ctx([USER_ROLE.ADMIN]), [USER_ROLE.ADMIN])).toEqual({ allowed: true });
    expect(checkRole(ctx([USER_ROLE.TEACHER]), [USER_ROLE.ADMIN, USER_ROLE.TEACHER])).toEqual({ allowed: true });
    expect(checkRole(ctx([USER_ROLE.TEACHER, USER_ROLE.ADMIN]), [USER_ROLE.ADMIN])).toEqual({ allowed: true });
  });

  it("forbids a teacher on an admin-only requirement and an admin on a teacher-only one", () => {
    expect(checkRole(ctx([USER_ROLE.TEACHER]), [USER_ROLE.ADMIN])).toEqual(FORBIDDEN);
    expect(checkRole(ctx([USER_ROLE.ADMIN]), [USER_ROLE.TEACHER])).toEqual(FORBIDDEN);
  });

  it("forbids a user without roles and an empty requirement", () => {
    expect(checkRole(ctx([]), [USER_ROLE.ADMIN])).toEqual(FORBIDDEN);
    expect(checkRole(ctx([USER_ROLE.ADMIN]), [])).toEqual(FORBIDDEN);
  });

  it("forbids anybody who is not ACTIVE any more, whatever the roles", () => {
    for (const status of [ACCOUNT_STATUS.DISABLED, ACCOUNT_STATUS.DELETED, ACCOUNT_STATUS.REQUEST_PENDING, ACCOUNT_STATUS.REJECTED, ACCOUNT_STATUS.REGISTRATION]) {
      expect(checkRole(ctx([USER_ROLE.ADMIN], status), [USER_ROLE.ADMIN]), status).toEqual(FORBIDDEN);
    }
  });
});
