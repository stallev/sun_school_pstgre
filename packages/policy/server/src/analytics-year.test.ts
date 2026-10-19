import { describe, expect, it } from "vitest";
import { ACCOUNT_STATUS, USER_ROLE, type AccountStatus, type UserRole } from "@sunschool/domain";
import {
  canViewGroupYear,
  canViewPupilYears,
  type CanViewGroupYearFacts,
  type CanViewPupilYearsFacts,
} from "./analytics-year";
import type { PolicySessionContext } from "./context";

const ctx = (roles: UserRole[], status: AccountStatus = ACCOUNT_STATUS.ACTIVE): PolicySessionContext => ({
  userId: "u1",
  status,
  roles,
});

const FORBIDDEN = { allowed: false, reason: "FORBIDDEN" } as const;
const NOT_FOUND = { allowed: false, reason: "NOT_FOUND" } as const;

const groupFacts = (overrides: Partial<CanViewGroupYearFacts> = {}): CanViewGroupYearFacts => ({
  gradeExistsInOrganization: true,
  teacherAssignedToGradeInYear: true,
  ...overrides,
});

const pupilFacts = (overrides: Partial<CanViewPupilYearsFacts> = {}): CanViewPupilYearsFacts => ({
  pupilExistsInOrganization: true,
  teacherCanAccessPupil: true,
  ...overrides,
});

describe("canViewGroupYear (AZ-48, AZ-D4)", () => {
  it("allows admin for an existing grade", () => {
    expect(canViewGroupYear(ctx([USER_ROLE.ADMIN]), groupFacts())).toEqual({ allowed: true });
    expect(
      canViewGroupYear(ctx([USER_ROLE.ADMIN]), groupFacts({ teacherAssignedToGradeInYear: false })),
    ).toEqual({ allowed: true });
  });

  it("allows teacher when assigned to the group in the year", () => {
    expect(canViewGroupYear(ctx([USER_ROLE.TEACHER]), groupFacts())).toEqual({ allowed: true });
  });

  it("returns NOT_FOUND when teacher is not assigned in the year", () => {
    expect(
      canViewGroupYear(
        ctx([USER_ROLE.TEACHER]),
        groupFacts({ teacherAssignedToGradeInYear: false }),
      ),
    ).toEqual(NOT_FOUND);
  });

  it("returns NOT_FOUND when the grade is outside the organization", () => {
    expect(
      canViewGroupYear(ctx([USER_ROLE.ADMIN]), groupFacts({ gradeExistsInOrganization: false })),
    ).toEqual(NOT_FOUND);
    expect(
      canViewGroupYear(ctx([USER_ROLE.TEACHER]), groupFacts({ gradeExistsInOrganization: false })),
    ).toEqual(NOT_FOUND);
  });

  it("forbids a user without teacher or admin role", () => {
    expect(canViewGroupYear(ctx([]), groupFacts())).toEqual(FORBIDDEN);
  });

  it("forbids an inactive user", () => {
    expect(canViewGroupYear(ctx([USER_ROLE.TEACHER], ACCOUNT_STATUS.DISABLED), groupFacts())).toEqual(
      FORBIDDEN,
    );
  });
});

describe("canViewPupilYears (AZ-49, AZ-50, AZ-D4)", () => {
  it("allows admin for an existing pupil", () => {
    expect(canViewPupilYears(ctx([USER_ROLE.ADMIN]), pupilFacts())).toEqual({ allowed: true });
    expect(
      canViewPupilYears(ctx([USER_ROLE.ADMIN]), pupilFacts({ teacherCanAccessPupil: false })),
    ).toEqual({ allowed: true });
  });

  it("allows teacher when the pupil is reachable under AZ-45", () => {
    expect(canViewPupilYears(ctx([USER_ROLE.TEACHER]), pupilFacts())).toEqual({ allowed: true });
  });

  it("returns NOT_FOUND for a foreign pupil", () => {
    expect(
      canViewPupilYears(ctx([USER_ROLE.TEACHER]), pupilFacts({ pupilExistsInOrganization: false })),
    ).toEqual(NOT_FOUND);
    expect(
      canViewPupilYears(ctx([USER_ROLE.ADMIN]), pupilFacts({ pupilExistsInOrganization: false })),
    ).toEqual(NOT_FOUND);
  });

  it("returns NOT_FOUND when teacher cannot access the pupil", () => {
    expect(
      canViewPupilYears(ctx([USER_ROLE.TEACHER]), pupilFacts({ teacherCanAccessPupil: false })),
    ).toEqual(NOT_FOUND);
  });

  it("forbids a user without teacher or admin role", () => {
    expect(canViewPupilYears(ctx([]), pupilFacts())).toEqual(FORBIDDEN);
  });

  it("forbids an inactive user", () => {
    expect(
      canViewPupilYears(ctx([USER_ROLE.TEACHER], ACCOUNT_STATUS.DISABLED), pupilFacts()),
    ).toEqual(FORBIDDEN);
  });
});
