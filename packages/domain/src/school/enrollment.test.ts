import { describe, expect, it } from "vitest";
import { ACADEMIC_YEAR_STATUS, CONSENT_STATUS } from "../constants/enums";
import { MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import { canEnroll, canUnenrollOrTransfer } from "./enrollment";

const base = {
  today: "2026-10-01",
  consentStatus: CONSENT_STATUS.ACTIVE,
  legacyConsentDeadlineOn: null,
  hasActiveEnrollment: false,
  isGroupActive: true,
  yearStatus: ACADEMIC_YEAR_STATUS.ACTIVE,
};

describe("canEnroll", () => {
  it("allows enrollment with ACTIVE consent", () => {
    expect(canEnroll(base)).toBeNull();
  });

  it("allows LEGACY_PENDING before deadline", () => {
    expect(
      canEnroll({
        ...base,
        consentStatus: CONSENT_STATUS.LEGACY_PENDING,
        legacyConsentDeadlineOn: "2026-12-31",
      }),
    ).toBeNull();
  });

  it("rejects LEGACY_PENDING after deadline", () => {
    expect(
      canEnroll({
        ...base,
        today: "2027-01-01",
        consentStatus: CONSENT_STATUS.LEGACY_PENDING,
        legacyConsentDeadlineOn: "2026-12-31",
      })?.code,
    ).toBe(MUTATION_ERROR_CODES.SCHOOL_CONSENT_REQUIRED);
  });

  it("rejects without consent", () => {
    expect(canEnroll({ ...base, consentStatus: null })?.code).toBe(
      MUTATION_ERROR_CODES.SCHOOL_CONSENT_REQUIRED,
    );
  });

  it("rejects second active enrollment", () => {
    expect(canEnroll({ ...base, hasActiveEnrollment: true })?.code).toBe(
      MUTATION_ERROR_CODES.SCHOOL_ALREADY_ENROLLED,
    );
  });

  it("rejects inactive group", () => {
    expect(canEnroll({ ...base, isGroupActive: false })?.code).toBe(
      MUTATION_ERROR_CODES.SCHOOL_GROUP_INACTIVE,
    );
  });

  it("rejects closed year", () => {
    expect(canEnroll({ ...base, yearStatus: ACADEMIC_YEAR_STATUS.CLOSED })?.code).toBe(
      MUTATION_ERROR_CODES.FORBIDDEN,
    );
  });
});

describe("canUnenrollOrTransfer", () => {
  it("requires an active enrollment", () => {
    expect(canUnenrollOrTransfer(true)).toBeNull();
    expect(canUnenrollOrTransfer(false)?.code).toBe(MUTATION_ERROR_CODES.SCHOOL_NOT_ENROLLED);
  });
});
