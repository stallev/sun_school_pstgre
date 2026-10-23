import { describe, expect, it } from "vitest";
import { ACCOUNT_STATUS, USER_ROLE, type AccountStatus, type UserRole } from "@sunschool/domain";
import { canCreateFamily, canMutateFamily, type CanMutateFamilyFacts } from "./family-mutate";
import type { PolicySessionContext } from "./context";

const ctx = (roles: UserRole[], status: AccountStatus = ACCOUNT_STATUS.ACTIVE): PolicySessionContext => ({
  userId: "u1",
  status,
  roles,
});

const FORBIDDEN = { allowed: false, reason: "FORBIDDEN" } as const;
const NOT_FOUND = { allowed: false, reason: "NOT_FOUND" } as const;

const facts = (overrides: Partial<CanMutateFamilyFacts> = {}): CanMutateFamilyFacts => ({
  familyExistsInOrganization: true,
  ...overrides,
});

describe("canMutateFamily (AZ-58, AZ-D4)", () => {
  it("allows admin when the family exists in the organization", () => {
    expect(canMutateFamily(ctx([USER_ROLE.ADMIN]), facts())).toEqual({ allowed: true });
  });

  it("returns NOT_FOUND for a foreign family", () => {
    expect(canMutateFamily(ctx([USER_ROLE.ADMIN]), facts({ familyExistsInOrganization: false }))).toEqual(
      NOT_FOUND,
    );
  });

  it("forbids teacher and parent", () => {
    expect(canMutateFamily(ctx([USER_ROLE.TEACHER]), facts())).toEqual(FORBIDDEN);
    expect(canMutateFamily(ctx([USER_ROLE.PARENT]), facts())).toEqual(FORBIDDEN);
  });

  it("forbids inactive admin", () => {
    expect(canMutateFamily(ctx([USER_ROLE.ADMIN], ACCOUNT_STATUS.DISABLED), facts())).toEqual(FORBIDDEN);
  });
});

describe("canCreateFamily (AZ-58)", () => {
  it("allows active admin", () => {
    expect(canCreateFamily(ctx([USER_ROLE.ADMIN]))).toEqual({ allowed: true });
  });

  it("forbids teacher", () => {
    expect(canCreateFamily(ctx([USER_ROLE.TEACHER]))).toEqual(FORBIDDEN);
  });
});
