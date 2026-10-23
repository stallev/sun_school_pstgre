import { describe, expect, it } from "vitest";
import { ACCOUNT_STATUS, USER_ROLE } from "@sunschool/domain";
import { canListFamilyContacts, type CanListFamilyContactsFacts } from "./family-contacts";
import type { PolicySessionContext } from "./context";

const FORBIDDEN = { allowed: false, reason: "FORBIDDEN" };
const NOT_FOUND = { allowed: false, reason: "NOT_FOUND" };

const ctx = (roles: (typeof USER_ROLE)[keyof typeof USER_ROLE][]): PolicySessionContext => ({
  userId: "user-1",
  status: ACCOUNT_STATUS.ACTIVE,
  roles,
});

const facts = (overrides: Partial<CanListFamilyContactsFacts> = {}): CanListFamilyContactsFacts => ({
  pupilExistsInOrganization: true,
  teacherCanAccessPupil: true,
  ...overrides,
});

describe("canListFamilyContacts (AZ-63, AZ-D4)", () => {
  it("allows admin for any pupil in the organization", () => {
    expect(canListFamilyContacts(ctx([USER_ROLE.ADMIN]), facts())).toEqual({ allowed: true });
    expect(
      canListFamilyContacts(
        ctx([USER_ROLE.ADMIN]),
        facts({ teacherCanAccessPupil: false }),
      ),
    ).toEqual({ allowed: true });
  });

  it("allows teacher only for reachable pupils", () => {
    expect(canListFamilyContacts(ctx([USER_ROLE.TEACHER]), facts())).toEqual({ allowed: true });
    expect(
      canListFamilyContacts(
        ctx([USER_ROLE.TEACHER]),
        facts({ teacherCanAccessPupil: false }),
      ),
    ).toEqual(NOT_FOUND);
  });

  it("returns NOT_FOUND for a foreign pupil", () => {
    expect(
      canListFamilyContacts(
        ctx([USER_ROLE.TEACHER]),
        facts({ pupilExistsInOrganization: false }),
      ),
    ).toEqual(NOT_FOUND);
    expect(
      canListFamilyContacts(
        ctx([USER_ROLE.ADMIN]),
        facts({ pupilExistsInOrganization: false }),
      ),
    ).toEqual(NOT_FOUND);
  });

  it("forbids parent and anonymous callers", () => {
    expect(canListFamilyContacts(ctx([USER_ROLE.PARENT]), facts())).toEqual(FORBIDDEN);
    expect(canListFamilyContacts(ctx([]), facts())).toEqual(FORBIDDEN);
  });
});
