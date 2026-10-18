import "server-only";

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  DELETION_REQUEST_TYPE,
  MUTATION_ERROR_CODES,
  computeDueOn,
  createChildDeletionRequestInputSchema,
  type CreateChildDeletionRequestInput,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { calendarDateFromIso } from "../school/calendar-date";
import {
  loadActorOrganizationId,
  loadPupilInOrganization,
  lockPupilRow,
} from "../school/school-pupil-shared.server";
import { isMutationErr, userHasAdminRole } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import {
  deletionAlreadyOpenResult,
  findOpenDeletionRequestForPupil,
  mapDeletionUniqueViolation,
} from "./deletion-shared.server";

type Tx = Prisma.TransactionClient;


export async function createChildDeletionRequestInTransaction(
  tx: Tx,
  actorUserId: string,
  input: CreateChildDeletionRequestInput,
  now: Date,
  schoolTimeZone: string,
): Promise<MutationResult<{ requestId: string }>> {
  if (!(await userHasAdminRole(tx, actorUserId))) {
    return { ok: false, code: MUTATION_ERROR_CODES.FORBIDDEN, message: "common.errors.forbidden" };
  }

  const organizationId = await loadActorOrganizationId(tx, actorUserId);
  if (!organizationId) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const locked = await lockPupilRow(tx, input.pupilId);
  if (!locked) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const pupil = await loadPupilInOrganization(tx, input.pupilId, organizationId);
  if (isMutationErr(pupil)) return pupil;

  const existing = await findOpenDeletionRequestForPupil(tx, input.pupilId);
  if (existing) return deletionAlreadyOpenResult();

  const dueOnIso = computeDueOn(now, schoolTimeZone);

  try {
    const created = await tx.deletionRequest.create({
      data: {
        type: DELETION_REQUEST_TYPE.CHILD_DATA,
        subjectPupilId: input.pupilId,
        requestedById: actorUserId,
        requestedAt: now,
        reason: input.guardianNote,
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
      reason: input.guardianNote,
    });

    return { ok: true, data: { requestId: created.id } };
  } catch (error) {
    const mapped = mapDeletionUniqueViolation(error);
    if (mapped) return mapped;
    throw error;
  }
}

/** Admin-only child data deletion request (deletion_requests §5.1, AZ-07). */
export async function createChildDeletionRequest(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
  now: Date,
  schoolTimeZone: string,
): Promise<MutationResult<{ requestId: string }>> {
  const parsed = createChildDeletionRequestInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction((tx) =>
    createChildDeletionRequestInTransaction(tx, actorUserId, parsed.data, now, schoolTimeZone),
  );
}
