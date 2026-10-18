import "server-only";

import {
  ACCOUNT_STATUS,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  DELETION_REQUEST_TYPE,
  MUTATION_ERROR_CODES,
  computeDueOn,
  createDeletionRequestInputSchema,
  type CreateDeletionRequestInput,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { calendarDateFromIso } from "../school/calendar-date";
import { mutationFromZodError } from "../access/map-zod-fields";
import {
  deletionAlreadyOpenResult,
  findOpenDeletionRequestForUser,
  mapDeletionUniqueViolation,
} from "./deletion-shared.server";

type Tx = Prisma.TransactionClient;

export async function createDeletionRequestInTransaction(
  tx: Tx,
  actorUserId: string,
  input: CreateDeletionRequestInput,
  now: Date,
  schoolTimeZone: string,
): Promise<MutationResult<{ requestId: string }>> {
  const user = await tx.appUser.findUnique({
    where: { id: actorUserId },
    select: { status: true },
  });
  if (!user) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  if (user.status === ACCOUNT_STATUS.DELETED) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const existing = await findOpenDeletionRequestForUser(tx, actorUserId);
  if (existing) return deletionAlreadyOpenResult();

  const dueOnIso = computeDueOn(now, schoolTimeZone);
  const reason = input.reason?.trim() ? input.reason.trim() : null;

  try {
    const created = await tx.deletionRequest.create({
      data: {
        type: DELETION_REQUEST_TYPE.ACCOUNT,
        subjectUserId: actorUserId,
        requestedById: actorUserId,
        requestedAt: now,
        reason,
        dueOn: calendarDateFromIso(dueOnIso),
      },
      select: { id: true },
    });

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.DELETION_REQUEST,
      entityId: created.id,
      action: AUDIT_ACTION.DELETION_REQUESTED,
      newValue: { type: DELETION_REQUEST_TYPE.ACCOUNT, subjectUserId: actorUserId },
    });

    return { ok: true, data: { requestId: created.id } };
  } catch (error) {
    const mapped = mapDeletionUniqueViolation(error);
    if (mapped) return mapped;
    throw error;
  }
}

/** Self-service account deletion request (deletion_requests §5.1, AZ-06). */
export async function createDeletionRequest(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
  now: Date,
  schoolTimeZone: string,
): Promise<MutationResult<{ requestId: string }>> {
  const parsed = createDeletionRequestInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction((tx) =>
    createDeletionRequestInTransaction(tx, actorUserId, parsed.data, now, schoolTimeZone),
  );
}
