import "server-only";

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  DELETION_REQUEST_STATUS,
  MUTATION_ERROR_CODES,
  deletionRequestIdInputSchema,
  type DeletionRequestIdInput,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { mutationFromZodError } from "../access/map-zod-fields";
import {
  deletionStatusInvalidResult,
  isOpenDeletionStatus,
  lockDeletionRequest,
} from "./deletion-shared.server";

type Tx = Prisma.TransactionClient;

export async function cancelDeletionRequestInTransaction(
  tx: Tx,
  actorUserId: string,
  input: DeletionRequestIdInput,
  now: Date,
): Promise<MutationResult> {
  const locked = await lockDeletionRequest(tx, input.requestId);
  if (!locked) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  if (locked.requestedById !== actorUserId) {
    return { ok: false, code: MUTATION_ERROR_CODES.FORBIDDEN, message: "common.errors.forbidden" };
  }
  if (!isOpenDeletionStatus(locked.status)) {
    return deletionStatusInvalidResult();
  }

  await tx.deletionRequest.update({
    where: { id: locked.id },
    data: {
      status: DELETION_REQUEST_STATUS.CANCELLED,
      resolvedById: actorUserId,
      resolvedAt: now,
    },
  });

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.DELETION_REQUEST,
    entityId: locked.id,
    action: AUDIT_ACTION.DELETION_CANCELLED,
  });

  return { ok: true };
}

/** Author cancels open request (deletion_requests §5.2, AZ-06). */
export async function cancelDeletionRequest(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
  now: Date,
): Promise<MutationResult> {
  const parsed = deletionRequestIdInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction((tx) => cancelDeletionRequestInTransaction(tx, actorUserId, parsed.data, now));
}
