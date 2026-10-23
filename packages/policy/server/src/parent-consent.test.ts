import { describe, expect, it } from "vitest";
import { ACCOUNT_STATUS, USER_ROLE, type UserRole } from "@sunschool/domain";
import { canMutateOwnChildConsent, type CanMutateOwnChildConsentFacts } from "./parent-consent";
import type { PolicySessionContext } from "./context";

const ctx = (roles: UserRole[], status = ACCOUNT_STATUS.ACTIVE): PolicySessionContext => ({
  userId: "user-1",
  status,
  roles,
});

const ownChild: CanMutateOwnChildConsentFacts = { pupilInOrganization: true, isOwnChild: true };
const foreignChild: CanMutateOwnChildConsentFacts = { pupilInOrganization: true, isOwnChild: false };
const missingPupil: CanMutateOwnChildConsentFacts = { pupilInOrganization: false, isOwnChild: false };

describe("canMutateOwnChildConsent (AZ-61)", () => {
  it("allows parent for own child", () => {
    expect(canMutateOwnChildConsent(ctx([USER_ROLE.PARENT]), ownChild)).toEqual({ allowed: true });
  });

  it("returns NOT_FOUND for foreign child", () => {
    expect(canMutateOwnChildConsent(ctx([USER_ROLE.PARENT]), foreignChild)).toEqual({
      allowed: false,
      reason: "NOT_FOUND",
    });
  });

  it("returns NOT_FOUND when pupil is missing", () => {
    expect(canMutateOwnChildConsent(ctx([USER_ROLE.PARENT]), missingPupil)).toEqual({
      allowed: false,
      reason: "NOT_FOUND",
    });
  });

  it("forbids teacher", () => {
    expect(canMutateOwnChildConsent(ctx([USER_ROLE.TEACHER]), ownChild)).toEqual({
      allowed: false,
      reason: "FORBIDDEN",
    });
  });
});
