import "server-only";

import {
  ACCOUNT_STATUS,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  DELETION_REQUEST_STATUS,
  DELETION_REQUEST_TYPE,
  MUTATION_ERROR_CODES,
  buildDeletionExecutionSummary,
  buildDeletionPlan,
  canExecute,
  executeDeletionInputSchema,
  matchesDeletionConfirmWord,
  type DeletionExecutionSummary,
  type ExecuteDeletionInput,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import {
  countAdminRoles,
  isMutationErr,
  userHasAdminRole,
} from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { loadPupilInOrganization, lockPupilRow } from "../school/school-pupil-shared.server";
import { anonymizeUserInTransaction } from "./anonymize-user";
import { deletionStatusInvalidResult, lockDeletionRequest } from "./deletion-shared.server";
import { eraseChildDataInTransaction } from "./erase-child-data";
import { gatherAccountPlanInput } from "./preview-plan";

type Tx = Prisma.TransactionClient;

const parseStoredSummary = (value: unknown): DeletionExecutionSummary | null => {
  if (!value || typeof value !== "object" || !("items" in value)) return null;
  const items = (value as DeletionExecutionSummary).items;
  if (!Array.isArray(items)) return null;
  return { items };
};

async function lockSubjectUser(tx: Tx, userId: string): Promise<boolean> {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM app_user WHERE id = ${userId}::uuid FOR UPDATE
  `;
  return rows.length > 0;
}

export async function executeDeletionInTransaction(
  tx: Tx,
  actorUserId: string,
  input: ExecuteDeletionInput,
  now: Date,
): Promise<MutationResult<{ summary: DeletionExecutionSummary }>> {
  if (!(await userHasAdminRole(tx, actorUserId))) {
    return { ok: false, code: MUTATION_ERROR_CODES.FORBIDDEN, message: "common.errors.forbidden" };
  }

  const locked = await lockDeletionRequest(tx, input.requestId);
  if (!locked) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  if (locked.status === DELETION_REQUEST_STATUS.DONE) {
    const row = await tx.deletionRequest.findUnique({
      where: { id: locked.id },
      select: { summary: true },
    });
    const summary = parseStoredSummary(row?.summary);
    if (summary) return { ok: true, data: { summary } };
    return deletionStatusInvalidResult();
  }

  const request = await tx.deletionRequest.findUnique({
    where: { id: locked.id },
    select: {
      type: true,
      subjectUserId: true,
      subjectPupilId: true,
      requestedById: true,
    },
  });
  if (!request) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const adminCount = await countAdminRoles(tx);
  const otherAdminExists = adminCount > 1;

  if (request.type === DELETION_REQUEST_TYPE.ACCOUNT) {
    const subjectUserId = request.subjectUserId;
    if (!subjectUserId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const user = await tx.appUser.findUnique({
      where: { id: subjectUserId },
      select: { status: true, organizationId: true },
    });
    if (!user || user.status === ACCOUNT_STATUS.DELETED) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const subjectIsAdmin = await userHasAdminRole(tx, subjectUserId);
    const subjectIsSoleAdmin = subjectIsAdmin && adminCount <= 1;
    const guard = canExecute({
      requestStatus: locked.status,
      subjectIsSoleAdmin,
      requestedByUserId: request.requestedById,
      executorUserId: actorUserId,
      otherAdminExists,
    });
    if (guard) return guard;

    if (!(await lockSubjectUser(tx, subjectUserId))) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const counts = await gatherAccountPlanInput(tx, subjectUserId, user.organizationId);
    const plan = buildDeletionPlan({ type: DELETION_REQUEST_TYPE.ACCOUNT, counts });
    const summary = buildDeletionExecutionSummary(plan);

    const { deletedOrdinal } = await anonymizeUserInTransaction(tx, subjectUserId, user.organizationId);

    await tx.deletionRequest.update({
      where: { id: locked.id },
      data: {
        status: DELETION_REQUEST_STATUS.DONE,
        resolvedById: actorUserId,
        resolvedAt: now,
        summary,
        reason: null,
      },
    });

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.DELETION_REQUEST,
      entityId: locked.id,
      action: AUDIT_ACTION.DELETION_EXECUTED,
      newValue: { summary },
    });
    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.APP_USER,
      entityId: subjectUserId,
      action: AUDIT_ACTION.DELETION_USER_ANONYMIZED,
      newValue: { deletedOrdinal },
    });

    return { ok: true, data: { summary } };
  }

  const subjectPupilId = request.subjectPupilId;
  if (!subjectPupilId) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const guard = canExecute({
    requestStatus: locked.status,
    subjectIsSoleAdmin: false,
    requestedByUserId: request.requestedById,
    executorUserId: actorUserId,
    otherAdminExists,
  });
  if (guard) return guard;

  const organizationId = (
    await tx.appUser.findUnique({
      where: { id: actorUserId },
      select: { organizationId: true },
    })
  )?.organizationId;
  if (!organizationId) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  if (!(await lockPupilRow(tx, subjectPupilId))) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const pupil = await loadPupilInOrganization(tx, subjectPupilId, organizationId);
  if (isMutationErr(pupil)) return pupil;

  await tx.deletionRequest.update({
    where: { id: locked.id },
    data: {
      subjectPupilId: null,
      subjectUserId: request.requestedById,
      reason: null,
    },
  });

  const { plan } = await eraseChildDataInTransaction(tx, subjectPupilId);
  const summary = buildDeletionExecutionSummary(plan);

  await tx.deletionRequest.update({
    where: { id: locked.id },
    data: {
      status: DELETION_REQUEST_STATUS.DONE,
      resolvedById: actorUserId,
      resolvedAt: now,
      summary,
    },
  });

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.DELETION_REQUEST,
    entityId: locked.id,
    action: AUDIT_ACTION.DELETION_EXECUTED,
    newValue: { summary },
  });

  return { ok: true, data: { summary } };
}

/** `IN_PROGRESS → DONE` (deletion_requests_contract §5.4, AZ-07). */
export async function executeDeletion(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
  now: Date,
): Promise<MutationResult<{ summary: DeletionExecutionSummary }>> {
  const parsed = executeDeletionInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  if (!matchesDeletionConfirmWord(parsed.data.confirmWord)) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "admin.deletions.confirm_wrong",
      fields: { confirmWord: "admin.deletions.confirm_wrong" },
    };
  }

  return db.$transaction(
    (tx) => executeDeletionInTransaction(tx, actorUserId, parsed.data, now),
    { maxWait: 10_000, timeout: 60_000 },
  );
}
