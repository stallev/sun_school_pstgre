import { TRAINER_MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import { TRAINER_STATUS, type TrainerStatus } from "../types/trainer-status";
import {
  validateApplicationComplete,
  type ApplicationCompleteFacts,
} from "./submit-trainer-application";

export type ApproveTrainerFacts = {
  status: TrainerStatus;
} & ApplicationCompleteFacts;

export type ApproveTrainerValidationError = {
  code: (typeof TRAINER_MUTATION_ERROR_CODES)[keyof typeof TRAINER_MUTATION_ERROR_CODES];
};

export function validateApproveTrainer(
  facts: ApproveTrainerFacts,
): ApproveTrainerValidationError | null {
  if (facts.status !== TRAINER_STATUS.PENDING) {
    return { code: TRAINER_MUTATION_ERROR_CODES.INVALID_STATUS_TRANSITION };
  }

  return validateApplicationComplete(facts);
}

export type RejectTrainerFacts = {
  status: TrainerStatus;
};

export type RejectTrainerValidationError = {
  code: (typeof TRAINER_MUTATION_ERROR_CODES)[keyof typeof TRAINER_MUTATION_ERROR_CODES];
};

export function validateRejectTrainer(
  facts: RejectTrainerFacts,
): RejectTrainerValidationError | null {
  if (facts.status !== TRAINER_STATUS.PENDING) {
    return { code: TRAINER_MUTATION_ERROR_CODES.INVALID_STATUS_TRANSITION };
  }

  return null;
}
