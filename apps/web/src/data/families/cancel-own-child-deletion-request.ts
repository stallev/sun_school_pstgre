import "server-only";

import {
  MUTATION_ERROR_CODES,
  deletionRequestIdInputSchema,
  type DeletionRequestIdInput,
  type MutationResult,
} from "@sunschool/domain";
import type { Prisma, PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { cancelDeletionRequestInTransaction } from "../deletions/cancel-request";
import { lockDeletionRequest } from "../deletions/deletion-shared.server";
import { loadParentGuardianForPupil } from "./parent-consent-access.server";

type Tx = Prisma.TransactionClient;

export async function cancelOwnChildDeletionRequestInTransaction(
  tx: Tx,
  actorUserId: string,
  input: DeletionRequestIdInput,
  now: Date,
): Promise<MutationResult> {
  const locked = await lockDeletionRequest(tx, input.requestId);
  if (!locked) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  if (!locked.subjectPupilId) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const access = await loadParentGuardianForPupil(tx, actorUserId, locked.subjectPupilId);
  if (isMutationErr(access)) return access;

  if (locked.requestedById !== actorUserId) {
    return { ok: false, code: MUTATION_ERROR_CODES.FORBIDDEN, message: "common.errors.forbidden" };
  }

  return cancelDeletionRequestInTransaction(tx, actorUserId, input, now);
}

/** Parent cancels own open child deletion request (families §6.4, AZ-62). */
export async function cancelOwnChildDeletionRequest(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
  now: Date,
): Promise<MutationResult> {
  const parsed = deletionRequestIdInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction((tx) =>
    cancelOwnChildDeletionRequestInTransaction(tx, actorUserId, parsed.data, now),
  );
}
