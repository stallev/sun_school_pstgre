import { MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import type { MutationErr } from "../types/mutation-result";

/** families_and_parents_contract §6.3 — last active consent revoke needs deletion confirmation. */
export const lastActiveConsentRevokeBlocked = (
  confirmDeletion: boolean,
  remainingActiveConsents: number,
): MutationErr | null => {
  if (remainingActiveConsents > 0) return null;
  if (!confirmDeletion) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.CONSENT_LAST_REQUIRES_DELETION,
      message: "parent.consent.confirm_deletion",
    };
  }
  return null;
};
