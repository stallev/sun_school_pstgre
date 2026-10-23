import { describe, expect, it } from "vitest";
import { USER_ROLE } from "../constants/user-role";
import { MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import {
  approveRequestInputSchema,
  changeRolesInputSchema,
  mergeUsersInputSchema,
  parentRoleUnavailableIfRequested,
  rejectRequestInputSchema,
} from "./access-admin";

const requestId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const otherId = "33333333-3333-4333-8333-333333333333";
const gradeId = "44444444-4444-4444-8444-444444444444";

describe("parentRoleUnavailableIfRequested", () => {
  it("returns ACCESS_ROLE_UNAVAILABLE when PARENT is requested and flag is off", () => {
    expect(parentRoleUnavailableIfRequested([USER_ROLE.PARENT])).toEqual({
      ok: false,
      code: MUTATION_ERROR_CODES.ACCESS_ROLE_UNAVAILABLE,
      message: "admin.approvals.parent_unavailable",
    });
  });

  it("allows PARENT when features.parents is enabled", () => {
    expect(parentRoleUnavailableIfRequested([USER_ROLE.PARENT], true)).toBeNull();
  });
});

describe("approveRequestInputSchema", () => {
  it("accepts roles and optional gradeIds", () => {
    const parsed = approveRequestInputSchema.parse({
      requestId,
      roles: [USER_ROLE.TEACHER],
      gradeIds: [gradeId],
    });
    expect(parsed.gradeIds).toEqual([gradeId]);
  });

  it("rejects empty roles", () => {
    expect(approveRequestInputSchema.safeParse({ requestId, roles: [] }).success).toBe(false);
  });

  it("accepts PARENT in roles for use-case ACCESS_ROLE_UNAVAILABLE", () => {
    const parsed = approveRequestInputSchema.safeParse({ requestId, roles: [USER_ROLE.PARENT] });
    expect(parsed.success).toBe(true);
  });
});

describe("rejectRequestInputSchema", () => {
  it("requires a non-empty reason", () => {
    const fail = rejectRequestInputSchema.safeParse({ requestId, reason: "   " });
    expect(fail.success).toBe(false);
    if (!fail.success) {
      expect(fail.error.issues.map((i) => i.message)).toContain("common.errors.reason_required");
    }
  });
});

describe("changeRolesInputSchema", () => {
  it("rejects empty roles", () => {
    expect(changeRolesInputSchema.safeParse({ userId, roles: [] }).success).toBe(false);
  });
});

describe("mergeUsersInputSchema", () => {
  it("rejects keep === merge", () => {
    const result = mergeUsersInputSchema.safeParse({ keepUserId: userId, mergeUserId: userId });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message)).toContain("admin.users.merge_same");
    }
  });

  it("accepts different users", () => {
    expect(
      mergeUsersInputSchema.safeParse({ keepUserId: userId, mergeUserId: otherId }).success,
    ).toBe(true);
  });
});
