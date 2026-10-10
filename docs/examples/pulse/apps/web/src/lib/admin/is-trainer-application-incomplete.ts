import {
  TRAINER_STATUS,
  validateApplicationComplete,
} from "@pulse/domain";

import type { TrainerApplicationDetail } from "@/data/admin/get-trainer-application.server";

type UploadStatus = "pending" | "ready" | "failed";

function toDocumentFacts(uploadStatus: string | null): { uploadStatus: UploadStatus } {
  if (
    uploadStatus === "ready" ||
    uploadStatus === "pending" ||
    uploadStatus === "failed"
  ) {
    return { uploadStatus };
  }

  return { uploadStatus: "pending" };
}

export function isTrainerApplicationIncomplete(
  application: TrainerApplicationDetail,
): boolean {
  if (application.status !== TRAINER_STATUS.PENDING) {
    return false;
  }

  return (
    validateApplicationComplete({
      certificates: application.certificates.map((document) =>
        toDocumentFacts(document.uploadStatus),
      ),
      verificationDocuments: application.verificationDocuments.map((document) =>
        toDocumentFacts(document.uploadStatus),
      ),
    }) !== null
  );
}
