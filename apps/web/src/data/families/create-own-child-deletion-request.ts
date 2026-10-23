import "server-only";

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  DELETION_REQUEST_TYPE,
  MUTATION_ERROR_CODES,
  computeDueOn,
  createOwnChildDeletionRequestInputSchema,
  type CreateOwnChildDeletionRequestInput,
  type MutationErr,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import {
  findOpenDeletionRequestForPupil,
  mapDeletionUniqueViolation,
} from "../deletions/deletion-shared.server";
import { calendarDateFromIso } from "../school/calendar-date";
import { lockPupilRow } from "../school/school-pupil-shared.server";
import { loadParentGuardianForPupil } from "./parent-consent-access.server";

type Tx = Prisma.TransactionClient;

function parentDeletionAlreadyOpenResult(): MutationErr {
  return {
    ok: false,
    code: MUTATION_ERROR_CODES.CONFLICT,
    message: "parent.deletion.already_open",
  };
}

function mapParentDeletionUniqueViolation(error: unknown): MutationResult<{ requestId: string }> | null {
  const mapped = mapDeletionUniqueViolation(error);
  if (mapped && !mapped.ok) {
    return parentDeletionAlreadyOpenResult();
  }
  return mapped;
}

export async function createOwnChildDeletionRequestInTransaction(
  tx: Tx,
  actorUserId: string,
  input: CreateOwnChildDeletionRequestInput,
  now: Date,
  schoolTimeZone: string,
): Promise<MutationResult<{ requestId: string }>> {
  const access = await loadParentGuardianForPupil(tx, actorUserId, input.pupilId);
  if (isMutationErr(access)) return access;

  const existing = await findOpenDeletionRequestForPupil(tx, input.pupilId);
  if (existing) return parentDeletionAlreadyOpenResult();

  if (!(await lockPupilRow(tx, input.pupilId))) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const dueOnIso = computeDueOn(now, schoolTimeZone);
  const reason = input.reason?.trim() ? input.reason.trim() : null;

  try {
    const created = await tx.deletionRequest.create({
      data: {
        type: DELETION_REQUEST_TYPE.CHILD_DATA,
        subjectPupilId: input.pupilId,
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
      newValue: { type: DELETION_REQUEST_TYPE.CHILD_DATA, subjectPupilId: input.pupilId },
      reason,
    });

    return { ok: true, data: { requestId: created.id } };
  } catch (error) {
    const mapped = mapParentDeletionUniqueViolation(error);
    if (mapped) return mapped;
    throw error;
  }
}

/** Parent creates child data deletion request (families §6.4, deletion §3, AZ-62). */
export async function createOwnChildDeletionRequest(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
  now: Date,
  schoolTimeZone: string,
): Promise<MutationResult<{ requestId: string }>> {
  const parsed = createOwnChildDeletionRequestInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction((tx) =>
    createOwnChildDeletionRequestInTransaction(tx, actorUserId, parsed.data, now, schoolTimeZone),
  );
}
