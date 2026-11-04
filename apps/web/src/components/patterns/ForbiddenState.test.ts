import { describe, expect, it } from "vitest";
import { USER_ROLE } from "@sunschool/domain";
import { shouldShowGroupTeacherForbiddenForAdmin } from "@/lib/auth/group-teacher-forbidden";

describe("ForbiddenState group teacher access (P27-CU8)", () => {
  it("shows admin-specific copy for admin without teacher role (D-18)", () => {
    expect(shouldShowGroupTeacherForbiddenForAdmin([USER_ROLE.ADMIN])).toBe(true);
  });

  it("keeps default forbidden copy for teacher and admin+teacher", () => {
    expect(shouldShowGroupTeacherForbiddenForAdmin([USER_ROLE.TEACHER])).toBe(false);
    expect(shouldShowGroupTeacherForbiddenForAdmin([USER_ROLE.ADMIN, USER_ROLE.TEACHER])).toBe(
      false,
    );
  });
});
