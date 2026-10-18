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
import { userHasAdminRole } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { deletionStatusInvalidResult, lockDeletionRequest } from "./deletion-shared.server";

type Tx = Prisma.TransactionClient;

export async function takeDeletionRequestInTransaction(
  tx: Tx,
  actorUserId: string,
  input: DeletionRequestIdInput,
  now: Date,
): Promise<MutationResult> {
  if (!(await userHasAdminRole(tx, actorUserId))) {
    return { ok: false, code: MUTATION_ERROR_CODES.FORBIDDEN, message: "common.errors.forbidden" };
  }

  const locked = await lockDeletionRequest(tx, input.requestId);
  if (!locked) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  if (locked.status !== DELETION_REQUEST_STATUS.NEW) {
    return deletionStatusInvalidResult();
  }

  await tx.deletionRequest.update({
    where: { id: locked.id },
    data: {
      status: DELETION_REQUEST_STATUS.IN_PROGRESS,
      takenById: actorUserId,
    },
  });

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.DELETION_REQUEST,
    entityId: locked.id,
    action: AUDIT_ACTION.DELETION_TAKEN,
    newValue: { takenById: actorUserId, takenAt: now.toISOString() },
  });

  return { ok: true };
}

/** `NEW → IN_PROGRESS` (deletion_requests §5.2, AZ-07). */
export async function takeDeletionRequest(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
  now: Date,
): Promise<MutationResult> {
  const parsed = deletionRequestIdInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction((tx) => takeDeletionRequestInTransaction(tx, actorUserId, parsed.data, now));
}
