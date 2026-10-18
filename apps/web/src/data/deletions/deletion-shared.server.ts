import "server-only";

import {
  DELETION_REQUEST_STATUS,
  MUTATION_ERROR_CODES,
  type DeletionRequestStatus,
  type MutationErr,
  type MutationResult,
} from "@sunschool/domain";
import type { Prisma } from "@sunschool/db";

type Tx = Prisma.TransactionClient;

export const OPEN_DELETION_STATUSES: readonly DeletionRequestStatus[] = [
  DELETION_REQUEST_STATUS.NEW,
  DELETION_REQUEST_STATUS.IN_PROGRESS,
];

export type LockedDeletionRequest = {
  id: string;
  status: DeletionRequestStatus;
  requestedById: string;
  subjectUserId: string | null;
  subjectPupilId: string | null;
};

export async function lockDeletionRequest(tx: Tx, requestId: string): Promise<LockedDeletionRequest | null> {
  const rows = await tx.$queryRaw<LockedDeletionRequest[]>`
    SELECT
      id,
      status,
      requested_by AS "requestedById",
      subject_user_id AS "subjectUserId",
      subject_pupil_id AS "subjectPupilId"
    FROM deletion_request
    WHERE id = ${requestId}::uuid
    FOR UPDATE
  `;
  return rows[0] ?? null;
}

export function deletionAlreadyOpenResult(): MutationErr {
  return {
    ok: false,
    code: MUTATION_ERROR_CODES.DELETION_ALREADY_OPEN,
    message: "common.deletion.already_open",
  };
}

export function deletionStatusInvalidResult(): MutationErr {
  return {
    ok: false,
    code: MUTATION_ERROR_CODES.DELETION_STATUS_INVALID,
    message: "admin.deletions.status_invalid",
  };
}

export async function findOpenDeletionRequestForUser(
  tx: Tx,
  subjectUserId: string,
): Promise<{ id: string } | null> {
  return tx.deletionRequest.findFirst({
    where: {
      subjectUserId,
      status: { in: [...OPEN_DELETION_STATUSES] },
    },
    select: { id: true },
  });
}

export async function findOpenDeletionRequestForPupil(
  tx: Tx,
  subjectPupilId: string,
): Promise<{ id: string } | null> {
  return tx.deletionRequest.findFirst({
    where: {
      subjectPupilId,
      status: { in: [...OPEN_DELETION_STATUSES] },
    },
    select: { id: true },
  });
}

export function isOpenDeletionStatus(status: DeletionRequestStatus): boolean {
  return OPEN_DELETION_STATUSES.includes(status);
}

export function mapDeletionUniqueViolation(error: unknown): MutationResult<{ requestId: string }> | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  ) {
    return deletionAlreadyOpenResult();
  }
  return null;
}
