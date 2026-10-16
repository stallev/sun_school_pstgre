import "server-only";
import {
  ACCESS_REQUEST_STATUS,
  ACCOUNT_STATUS,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  MUTATION_WARNING_CODES,
  USER_ROLE,
  approveRequestInputSchema,
  parentRoleUnavailableIfRequested,
  type ApproveRequestInput,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";

type Tx = Prisma.TransactionClient;

export async function approveRequestInTransaction(
  tx: Tx,
  actorUserId: string,
  input: ApproveRequestInput,
  now: Date,
): Promise<MutationResult> {
  const parentUnavailable = parentRoleUnavailableIfRequested(input.roles);
  if (parentUnavailable) return parentUnavailable;

  const locked = await lockAccessRequest(tx, input.requestId);
  if (!locked) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  if (locked.status !== ACCESS_REQUEST_STATUS.PENDING) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.ACCESS_REQUEST_DECIDED,
      message: "admin.approvals.already_decided",
    };
  }

  const hasUser = await lockAppUserRow(tx, locked.userId);
  if (!hasUser) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const user = await tx.appUser.findUnique({
    where: { id: locked.userId },
    select: { status: true, organizationId: true },
  });
  if (!user || user.status !== ACCOUNT_STATUS.REQUEST_PENDING) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.ACCESS_STATUS_INVALID,
      message: "auth.errors.status_invalid",
    };
  }

  const gradeError = await validateGradeIdsForActiveYear(tx, user.organizationId, input.gradeIds);
  if (gradeError) return gradeError;

  await replaceUserRoles(tx, locked.userId, input.roles);
  await syncTeacherAssignmentsForActiveYear(
    tx,
    locked.userId,
    user.organizationId,
    input.roles,
    input.gradeIds,
  );

  await tx.accessRequest.update({
    where: { id: locked.id },
    data: {
      status: ACCESS_REQUEST_STATUS.APPROVED,
      decidedById: actorUserId,
      decidedAt: now,
    },
  });

  await tx.appUser.update({
    where: { id: locked.userId },
    data: { status: ACCOUNT_STATUS.ACTIVE },
  });

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.ACCESS_REQUEST,
    entityId: locked.id,
    action: AUDIT_ACTION.ACCESS_REQUEST_APPROVED,
    newValue: { roles: input.roles, gradeIds: input.gradeIds },
  });

  const warnings =
    input.roles.includes(USER_ROLE.TEACHER) && input.gradeIds.length === 0
      ? [MUTATION_WARNING_CODES.NO_GROUPS]
      : undefined;

  return warnings ? { ok: true, warnings } : { ok: true };
}

import { validateGradeIdsForActiveYear } from "./active-academic-year.server";
import { lockAccessRequest } from "./lock-access-request.server";
import { lockAppUserRow } from "./access-admin-guards.server";
import { mutationFromZodError } from "./map-zod-fields";
import { replaceUserRoles, syncTeacherAssignmentsForActiveYear } from "./sync-teacher-assignments.server";

/** `REQUEST_PENDING → ACTIVE` (access_requests §5.4). */
export async function approveRequest(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
  now: Date,
): Promise<MutationResult> {
  const parsed = approveRequestInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const parentUnavailable = parentRoleUnavailableIfRequested(parsed.data.roles);
  if (parentUnavailable) return parentUnavailable;

  return db.$transaction((tx) => approveRequestInTransaction(tx, actorUserId, parsed.data, now));
}
