import { describe, expect, it } from "vitest";
import { USER_ROLE } from "@sunschool/domain";
import { resolveDefaultApprovalRoles } from "@/components/admin/ApprovalRoleSelect";

describe("approval role select (P25-CU7)", () => {
  it("defaults to teacher when the application did not specify roles", () => {
    expect(resolveDefaultApprovalRoles([])).toEqual([USER_ROLE.TEACHER]);
  });

  it("keeps roles requested on the application", () => {
    expect(resolveDefaultApprovalRoles([USER_ROLE.ADMIN])).toEqual([USER_ROLE.ADMIN]);
  });
});
