import { describe, expect, it } from "vitest";
import {
  ACADEMIC_YEAR_STATUS,
  ACCOUNT_STATUS,
  USER_ROLE,
  type AccountStatus,
  type UserRole,
} from "@sunschool/domain";
import { canEditPupilBirthDate, type CanEditPupilBirthDateFacts } from "./pupil-birth-date";
import type { PolicySessionContext } from "./context";

const ctx = (roles: UserRole[], status: AccountStatus = ACCOUNT_STATUS.ACTIVE): PolicySessionContext => ({
  userId: "u1",
  status,
  roles,
});

const FORBIDDEN = { allowed: false, reason: "FORBIDDEN" } as const;
const NOT_FOUND = { allowed: false, reason: "NOT_FOUND" } as const;

const facts = (overrides: Partial<CanEditPupilBirthDateFacts> = {}): CanEditPupilBirthDateFacts => ({
  pupilExistsInOrganization: true,
  teacherCanEditPupil: true,
  academicYearStatus: ACADEMIC_YEAR_STATUS.ACTIVE,
  ...overrides,
});

describe("canEditPupilBirthDate (AZ-20a, AZ-D4, AZ-P5)", () => {
  it("allows admin when the pupil exists", () => {
    expect(canEditPupilBirthDate(ctx([USER_ROLE.ADMIN]), facts())).toEqual({ allowed: true });
    expect(
      canEditPupilBirthDate(ctx([USER_ROLE.ADMIN]), facts({ teacherCanEditPupil: false })),
    ).toEqual({ allowed: true });
  });

  it("allows teacher for a pupil in the assigned active-year group", () => {
    expect(canEditPupilBirthDate(ctx([USER_ROLE.TEACHER]), facts())).toEqual({ allowed: true });
  });

  it("returns NOT_FOUND for a foreign group or missing enrollment", () => {
    expect(
      canEditPupilBirthDate(ctx([USER_ROLE.TEACHER]), facts({ teacherCanEditPupil: false })),
    ).toEqual(NOT_FOUND);
    expect(
      canEditPupilBirthDate(ctx([USER_ROLE.TEACHER]), facts({ pupilExistsInOrganization: false })),
    ).toEqual(NOT_FOUND);
  });

  it("returns FORBIDDEN when the active year is closed for teacher", () => {
    expect(
      canEditPupilBirthDate(
        ctx([USER_ROLE.TEACHER]),
        facts({ academicYearStatus: ACADEMIC_YEAR_STATUS.CLOSED }),
      ),
    ).toEqual(FORBIDDEN);
  });

  it("forbids parent", () => {
    expect(canEditPupilBirthDate(ctx([USER_ROLE.PARENT]), facts())).toEqual(FORBIDDEN);
  });
});
