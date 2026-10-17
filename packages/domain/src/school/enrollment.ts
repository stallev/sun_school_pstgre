import { CONSENT_STATUS, type AcademicYearStatus, type ConsentStatus } from "../constants/enums";
import { MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import type { MutationErr } from "../types/mutation-result";
import { isYearOpenForEnrollment } from "./year";

export type CanEnrollInput = {
  /** Calendar date `YYYY-MM-DD` in the school's context (ADR-004). */
  today: string;
  consentStatus: ConsentStatus | null;
  /** Required when `consentStatus` is `LEGACY_PENDING` (ADR-011). */
  legacyConsentDeadlineOn: string | null;
  hasActiveEnrollment: boolean;
  isGroupActive: boolean;
  yearStatus: AcademicYearStatus;
};

const hasEnrollableConsent = (input: CanEnrollInput): boolean => {
  if (input.consentStatus === CONSENT_STATUS.ACTIVE) return true;
  if (input.consentStatus === CONSENT_STATUS.LEGACY_PENDING) {
    if (!input.legacyConsentDeadlineOn) return false;
    return input.today <= input.legacyConsentDeadlineOn;
  }
  return false;
};

/** school_year_and_groups_contract §5.9, §6; ADR-011 §4 — consent and enrollment guards (INV-07, INV-08). */
export const canEnroll = (input: CanEnrollInput): MutationErr | null => {
  if (!isYearOpenForEnrollment(input.yearStatus)) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.FORBIDDEN,
      message: "common.errors.year_closed",
    };
  }
  if (!input.isGroupActive) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.SCHOOL_GROUP_INACTIVE,
      message: "admin.group.inactive",
    };
  }
  if (!hasEnrollableConsent(input)) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.SCHOOL_CONSENT_REQUIRED,
      message: "admin.people.consent_required",
    };
  }
  if (input.hasActiveEnrollment) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.SCHOOL_ALREADY_ENROLLED,
      message: "admin.people.already_enrolled",
    };
  }
  return null;
};

export const canUnenrollOrTransfer = (hasActiveEnrollment: boolean): MutationErr | null => {
  if (!hasActiveEnrollment) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.SCHOOL_NOT_ENROLLED,
      message: "admin.people.not_enrolled",
    };
  }
  return null;
};
