import "server-only";

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  DELETION_REQUEST_STATUS,
  MUTATION_ERROR_CODES,
  rejectDeletionRequestInputSchema,
  type RejectDeletionRequestInput,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { userHasAdminRole } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import {
  deletionStatusInvalidResult,
  isOpenDeletionStatus,
  lockDeletionRequest,
} from "./deletion-shared.server";

type Tx = Prisma.TransactionClient;

export async function rejectDeletionRequestInTransaction(
  tx: Tx,
  actorUserId: string,
  input: RejectDeletionRequestInput,
  now: Date,
): Promise<MutationResult> {
  if (!(await userHasAdminRole(tx, actorUserId))) {
    return { ok: false, code: MUTATION_ERROR_CODES.FORBIDDEN, message: "common.errors.forbidden" };
  }

  const locked = await lockDeletionRequest(tx, input.requestId);
  if (!locked) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  if (!isOpenDeletionStatus(locked.status)) {
    return deletionStatusInvalidResult();
  }

  await tx.deletionRequest.update({
    where: { id: locked.id },
    data: {
      status: DELETION_REQUEST_STATUS.REJECTED,
      rejectReason: input.reason,
      resolvedById: actorUserId,
      resolvedAt: now,
    },
  });

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.DELETION_REQUEST,
    entityId: locked.id,
    action: AUDIT_ACTION.DELETION_REJECTED,
    reason: input.reason,
  });

  return { ok: true };
}

/** Admin rejects with mandatory reason (deletion_requests §5.2, §8, AZ-07). */
export async function rejectDeletionRequest(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
  now: Date,
): Promise<MutationResult> {
  const parsed = rejectDeletionRequestInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction((tx) => rejectDeletionRequestInTransaction(tx, actorUserId, parsed.data, now));
}
