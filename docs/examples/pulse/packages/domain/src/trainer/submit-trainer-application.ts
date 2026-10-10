import { TRAINER_MUTATION_ERROR_CODES } from "../constants/mutation-error-codes";
import { isTrainerTimezone } from "../constants/trainer-timezones";
import { TRAINER_STATUS, type TrainerStatus } from "../types/trainer-status";

export type TrainerTimezoneValidationError = {
  code: typeof TRAINER_MUTATION_ERROR_CODES.VALIDATION;
};

export function validateTrainerTimezone(
  timezone: string,
): TrainerTimezoneValidationError | null {
  if (!isTrainerTimezone(timezone)) {
    return { code: TRAINER_MUTATION_ERROR_CODES.VALIDATION };
  }

  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return null;
  } catch {
    return { code: TRAINER_MUTATION_ERROR_CODES.VALIDATION };
  }
}

export type ApplicationDocumentFacts = {
  uploadStatus: "pending" | "ready" | "failed";
};

export type ApplicationCompleteFacts = {
  certificates: ApplicationDocumentFacts[];
  verificationDocuments: ApplicationDocumentFacts[];
};

export type ApplicationCompleteValidationError = {
  code: typeof TRAINER_MUTATION_ERROR_CODES.APPLICATION_INCOMPLETE;
};

export function validateApplicationComplete(
  facts: ApplicationCompleteFacts,
): ApplicationCompleteValidationError | null {
  const hasReadyCertificate = facts.certificates.some(
    (certificate) => certificate.uploadStatus === "ready",
  );
  const hasReadyVerificationDoc = facts.verificationDocuments.some(
    (document) => document.uploadStatus === "ready",
  );

  if (!hasReadyCertificate && !hasReadyVerificationDoc) {
    return { code: TRAINER_MUTATION_ERROR_CODES.APPLICATION_INCOMPLETE };
  }

  return null;
}

export type SubmitTrainerApplicationFacts = {
  status: TrainerStatus;
  submittedAt: Date | null;
} & ApplicationCompleteFacts;

export type SubmitTrainerApplicationValidationError = {
  code: (typeof TRAINER_MUTATION_ERROR_CODES)[keyof typeof TRAINER_MUTATION_ERROR_CODES];
};

export function validateSubmitTrainerApplication(
  facts: SubmitTrainerApplicationFacts,
): SubmitTrainerApplicationValidationError | null {
  if (facts.status === TRAINER_STATUS.APPROVED) {
    return { code: TRAINER_MUTATION_ERROR_CODES.ALREADY_APPROVED };
  }

  if (facts.status !== TRAINER_STATUS.PENDING && facts.status !== TRAINER_STATUS.REJECTED) {
    return { code: TRAINER_MUTATION_ERROR_CODES.INVALID_STATUS_TRANSITION };
  }

  return validateApplicationComplete(facts);
}

export type AssetReadyFacts = {
  uploadStatus: "pending" | "ready" | "failed";
};

export type AssetReadyValidationError = {
  code: typeof TRAINER_MUTATION_ERROR_CODES.VALIDATION;
};

export function validateAssetReadyForLink(
  asset: AssetReadyFacts | null | undefined,
): AssetReadyValidationError | null {
  if (!asset || asset.uploadStatus !== "ready") {
    return { code: TRAINER_MUTATION_ERROR_CODES.VALIDATION };
  }

  return null;
}
