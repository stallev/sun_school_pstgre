import { COMPLAINT_MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import { COMPLAINT_STATUS, type ComplaintStatus } from "../types/complaint-status";
import {
  complaintResolutionRequiresNotes,
  COMPLAINT_RESOLUTION_NOTES_MIN_LENGTH,
  type ComplaintResolution,
} from "../types/complaint-resolution";
import type { FileComplaintValidationError } from "./file-complaint";

export type CloseComplaintFacts = {
  status: ComplaintStatus;
};

export type CloseComplaintInputFacts = {
  resolution: ComplaintResolution;
  adminNotes?: string;
};

export function validateCloseComplaint(
  facts: CloseComplaintFacts,
): FileComplaintValidationError | null {
  if (facts.status === COMPLAINT_STATUS.CLOSED) {
    return { code: COMPLAINT_MUTATION_ERROR_CODES.ALREADY_PROCESSED };
  }

  return null;
}

export function validateCloseComplaintInput(
  facts: CloseComplaintInputFacts,
): FileComplaintValidationError | null {
  if (!complaintResolutionRequiresNotes(facts.resolution)) {
    return null;
  }

  const notes = facts.adminNotes?.trim() ?? "";
  if (notes.length < COMPLAINT_RESOLUTION_NOTES_MIN_LENGTH) {
    return { code: COMPLAINT_MUTATION_ERROR_CODES.VALIDATION };
  }

  return null;
}
