import { describe, expect, it } from "vitest";
import { CONSENT_STATUS, MUTATION_ERROR_CODES, canEnroll } from "@sunschool/domain";
import { SYNTHETIC_LEGACY_IMPORT } from "../../test/fixtures/legacy-compatible/synthetic-fixture";

describe("legacy-compatible synthetic import", () => {
  it("allows enroll while LEGACY_PENDING is inside the transitional deadline", () => {
    expect(
      canEnroll({
        today: SYNTHETIC_LEGACY_IMPORT.todayInsideDeadline,
        consentStatus: SYNTHETIC_LEGACY_IMPORT.consent.status,
        legacyConsentDeadlineOn: SYNTHETIC_LEGACY_IMPORT.appSetting.legacyConsentDeadlineOn,
        hasActiveEnrollment: false,
        isGroupActive: true,
        yearStatus: SYNTHETIC_LEGACY_IMPORT.academicYear.status,
      }),
    ).toBeNull();
  });

  it("blocks new enroll after the transitional deadline", () => {
    expect(
      canEnroll({
        today: SYNTHETIC_LEGACY_IMPORT.todayAfterDeadline,
        consentStatus: SYNTHETIC_LEGACY_IMPORT.consent.status,
        legacyConsentDeadlineOn: SYNTHETIC_LEGACY_IMPORT.appSetting.legacyConsentDeadlineOn,
        hasActiveEnrollment: false,
        isGroupActive: true,
        yearStatus: SYNTHETIC_LEGACY_IMPORT.academicYear.status,
      })?.code,
    ).toBe(MUTATION_ERROR_CODES.SCHOOL_CONSENT_REQUIRED);
  });

  it("requires ACTIVE consent for pupils without LEGACY_PENDING", () => {
    expect(
      canEnroll({
        today: SYNTHETIC_LEGACY_IMPORT.todayInsideDeadline,
        consentStatus: null,
        legacyConsentDeadlineOn: SYNTHETIC_LEGACY_IMPORT.appSetting.legacyConsentDeadlineOn,
        hasActiveEnrollment: false,
        isGroupActive: true,
        yearStatus: SYNTHETIC_LEGACY_IMPORT.academicYear.status,
      })?.code,
    ).toBe(MUTATION_ERROR_CODES.SCHOOL_CONSENT_REQUIRED);
    expect(
      canEnroll({
        today: SYNTHETIC_LEGACY_IMPORT.todayInsideDeadline,
        consentStatus: CONSENT_STATUS.ACTIVE,
        legacyConsentDeadlineOn: null,
        hasActiveEnrollment: false,
        isGroupActive: true,
        yearStatus: SYNTHETIC_LEGACY_IMPORT.academicYear.status,
      }),
    ).toBeNull();
  });
});
