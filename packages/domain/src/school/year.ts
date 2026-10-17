import { ACADEMIC_YEAR_STATUS, type AcademicYearStatus } from "../constants/enums";
import { MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import type { MutationErr } from "../types/mutation-result";

export type YearDateRange = {
  startsOn: string;
  endsOn: string;
};

/** ISO calendar dates (`YYYY-MM-DD`); lexicographic order matches chronological order. */
export const validateYearDates = (startsOn: string, endsOn: string): MutationErr | null => {
  if (startsOn >= endsOn) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "admin.year.dates_invalid",
      fields: { endsOn: "admin.year.dates_invalid" },
    };
  }
  return null;
};

export const yearRangesOverlap = (left: YearDateRange, right: YearDateRange): boolean =>
  left.startsOn <= right.endsOn && right.startsOn <= left.endsOn;

export const yearRangeOverlapsAny = (
  candidate: YearDateRange,
  existing: readonly YearDateRange[],
): boolean => existing.some((range) => yearRangesOverlap(candidate, range));

export const validateYearNoOverlap = (
  candidate: YearDateRange,
  existing: readonly YearDateRange[],
): MutationErr | null => {
  if (yearRangeOverlapsAny(candidate, existing)) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.SCHOOL_YEAR_OVERLAP,
      message: "admin.year.overlap",
    };
  }
  return null;
};

export type CanActivateYearInput = {
  yearStatus: AcademicYearStatus;
  hasOtherActiveYear: boolean;
};

/** school_year_and_groups_contract §5.1, §6 — year must be DRAFT and no other ACTIVE year (INV-01). */
export const canActivateYear = (input: CanActivateYearInput): MutationErr | null => {
  if (input.yearStatus !== ACADEMIC_YEAR_STATUS.DRAFT) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.SCHOOL_YEAR_STATUS_INVALID,
      message: "admin.year.status_invalid",
    };
  }
  if (input.hasOtherActiveYear) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.SCHOOL_YEAR_ACTIVE_EXISTS,
      message: "admin.year.active_exists",
    };
  }
  return null;
};

export type CanCloseYearInput = {
  yearStatus: AcademicYearStatus;
};

export const canCloseYear = (input: CanCloseYearInput): MutationErr | null => {
  if (input.yearStatus !== ACADEMIC_YEAR_STATUS.ACTIVE) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.SCHOOL_YEAR_STATUS_INVALID,
      message: "admin.year.status_invalid",
    };
  }
  return null;
};

export const isYearOpenForEnrollment = (yearStatus: AcademicYearStatus): boolean =>
  yearStatus === ACADEMIC_YEAR_STATUS.DRAFT || yearStatus === ACADEMIC_YEAR_STATUS.ACTIVE;
