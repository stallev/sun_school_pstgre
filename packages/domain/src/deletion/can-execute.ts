import { DELETION_REQUEST_STATUS, type DeletionRequestStatus } from "../constants/enums";
import { MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import type { MutationErr } from "../types/mutation-result";

export type CanExecuteDeletionInput = {
  requestStatus: DeletionRequestStatus;
  subjectIsSoleAdmin: boolean;
  requestedByUserId: string;
  executorUserId: string;
  otherAdminExists: boolean;
};

/** deletion_requests_contract §5.4, §8 — admin execution guards (УД-9). */
export const canExecute = (input: CanExecuteDeletionInput): MutationErr | null => {
  if (input.requestStatus !== DELETION_REQUEST_STATUS.IN_PROGRESS) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.DELETION_STATUS_INVALID,
      message: "admin.deletions.status_invalid",
    };
  }
  if (input.subjectIsSoleAdmin) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.DELETION_LAST_ADMIN,
      message: "admin.deletions.last_admin",
    };
  }
  if (input.otherAdminExists && input.executorUserId === input.requestedByUserId) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.DELETION_SELF_EXECUTE,
      message: "admin.deletions.self_execute",
    };
  }
  return null;
};
