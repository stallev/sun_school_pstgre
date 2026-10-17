import "server-only";
import { CONSENT_STATUS, type ConsentStatus } from "@sunschool/domain";

/** Teacher roster / check UI — consent flag only (school_year §7 S-3, AZ-21). */
export type TeacherPupilConsentView = {
  hasConsent: boolean;
};

export const hasEnrollableConsentStatus = (
  status: ConsentStatus,
  todayIso: string,
  legacyConsentDeadlineOn: string | null,
): boolean => {
  if (status === CONSENT_STATUS.ACTIVE) return true;
  if (status === CONSENT_STATUS.LEGACY_PENDING) {
    if (!legacyConsentDeadlineOn) return false;
    return todayIso <= legacyConsentDeadlineOn;
  }
  return false;
};

export const toTeacherPupilConsentView = (
  consentStatus: ConsentStatus | null,
  todayIso: string,
  legacyConsentDeadlineOn: string | null,
): TeacherPupilConsentView => ({
  hasConsent:
    consentStatus !== null &&
    hasEnrollableConsentStatus(consentStatus, todayIso, legacyConsentDeadlineOn),
});
