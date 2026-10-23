import { describe, expect, it } from "vitest";
import { ACCOUNT_STATUS, USER_ROLE, type AccountStatus, type UserRole } from "@sunschool/domain";
import {
  canAwardManually,
  canRevokeAward,
  canSetGroupAchievementMode,
  type CanAwardManuallyFacts,
  type CanSetGroupAchievementModeFacts,
} from "./achievements-mutate";
import type { PolicySessionContext } from "./context";

const ctx = (roles: UserRole[], status: AccountStatus = ACCOUNT_STATUS.ACTIVE): PolicySessionContext => ({
  userId: "u1",
  status,
  roles,
});

const FORBIDDEN = { allowed: false, reason: "FORBIDDEN" } as const;
const NOT_FOUND = { allowed: false, reason: "NOT_FOUND" } as const;

const awardFacts = (overrides: Partial<CanAwardManuallyFacts> = {}): CanAwardManuallyFacts => ({
  pupilExistsInOrganization: true,
  teacherCanAccessPupil: true,
  ...overrides,
});

describe("canAwardManually (AZ-53, AZ-D4)", () => {
  it("allows admin for an existing pupil", () => {
    expect(canAwardManually(ctx([USER_ROLE.ADMIN]), awardFacts())).toEqual({ allowed: true });
    expect(
      canAwardManually(ctx([USER_ROLE.ADMIN]), awardFacts({ teacherCanAccessPupil: false })),
    ).toEqual({ allowed: true });
  });

  it("allows teacher when the pupil is in a reachable group", () => {
    expect(canAwardManually(ctx([USER_ROLE.TEACHER]), awardFacts())).toEqual({ allowed: true });
  });

  it("returns NOT_FOUND for a foreign pupil", () => {
    expect(
      canAwardManually(ctx([USER_ROLE.TEACHER]), awardFacts({ pupilExistsInOrganization: false })),
    ).toEqual(NOT_FOUND);
    expect(
      canAwardManually(ctx([USER_ROLE.ADMIN]), awardFacts({ pupilExistsInOrganization: false })),
    ).toEqual(NOT_FOUND);
  });

  it("returns NOT_FOUND when teacher cannot access the pupil", () => {
    expect(
      canAwardManually(ctx([USER_ROLE.TEACHER]), awardFacts({ teacherCanAccessPupil: false })),
    ).toEqual(NOT_FOUND);
  });

  it("forbids a user without teacher or admin role", () => {
    expect(canAwardManually(ctx([]), awardFacts())).toEqual(FORBIDDEN);
  });

  it("forbids an inactive user", () => {
    expect(canAwardManually(ctx([USER_ROLE.TEACHER], ACCOUNT_STATUS.DISABLED), awardFacts())).toEqual(
      FORBIDDEN,
    );
  });
});

const modeFacts = (
  overrides: Partial<CanSetGroupAchievementModeFacts> = {},
): CanSetGroupAchievementModeFacts => ({
  gradeExistsInOrganization: true,
  teacherAssignedToGradeInYear: true,
  ...overrides,
});

describe("canSetGroupAchievementMode (AZ-55, AZ-D4)", () => {
  it("allows admin for an existing grade", () => {
    expect(canSetGroupAchievementMode(ctx([USER_ROLE.ADMIN]), modeFacts())).toEqual({ allowed: true });
    expect(
      canSetGroupAchievementMode(
        ctx([USER_ROLE.ADMIN]),
        modeFacts({ teacherAssignedToGradeInYear: false }),
      ),
    ).toEqual({ allowed: true });
  });

  it("allows teacher when assigned to the grade in the year", () => {
    expect(canSetGroupAchievementMode(ctx([USER_ROLE.TEACHER]), modeFacts())).toEqual({ allowed: true });
  });

  it("returns NOT_FOUND for a foreign grade", () => {
    expect(
      canSetGroupAchievementMode(
        ctx([USER_ROLE.TEACHER]),
        modeFacts({ gradeExistsInOrganization: false }),
      ),
    ).toEqual(NOT_FOUND);
  });

  it("returns NOT_FOUND when teacher is not assigned to the grade", () => {
    expect(
      canSetGroupAchievementMode(
        ctx([USER_ROLE.TEACHER]),
        modeFacts({ teacherAssignedToGradeInYear: false }),
      ),
    ).toEqual(NOT_FOUND);
  });
});

describe("canRevokeAward (AZ-54)", () => {
  it("allows admin", () => {
    expect(canRevokeAward(ctx([USER_ROLE.ADMIN]))).toEqual({ allowed: true });
  });

  it("forbids teacher", () => {
    expect(canRevokeAward(ctx([USER_ROLE.TEACHER]))).toEqual(FORBIDDEN);
  });

  it("forbids a user without admin role", () => {
    expect(canRevokeAward(ctx([]))).toEqual(FORBIDDEN);
  });

  it("forbids an inactive admin", () => {
    expect(canRevokeAward(ctx([USER_ROLE.ADMIN], ACCOUNT_STATUS.DISABLED))).toEqual(FORBIDDEN);
  });
});
