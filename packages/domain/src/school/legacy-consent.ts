import { MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import type { MutationErr } from "../types/mutation-result";

/** Inclusive calendar-day difference: `to` minus `from` (UTC date strings). */
export const countCalendarDaysBetween = (fromIso: string, toIso: string): number => {
  const fromMs = Date.parse(`${fromIso}T00:00:00.000Z`);
  const toMs = Date.parse(`${toIso}T00:00:00.000Z`);
  return Math.round((toMs - fromMs) / 86_400_000);
};

export type ValidateExtendLegacyDeadlineInput = {
  currentDeadlineOn: string | null;
  newDeadlineOn: string;
};

/** school_year_and_groups_contract §5.9a — new deadline must be after the current one. */
export const validateExtendLegacyDeadline = (
  input: ValidateExtendLegacyDeadlineInput,
): MutationErr | null => {
  if (!input.currentDeadlineOn) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "admin.people.legacy_deadline_not_set",
    };
  }
  if (input.newDeadlineOn <= input.currentDeadlineOn) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "admin.people.legacy_deadline_not_extended",
      fields: { newDeadlineOn: "admin.people.legacy_deadline_not_extended" },
    };
  }
  return null;
};
