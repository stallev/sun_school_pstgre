import "server-only";
import {
  ACCOUNT_STATUS,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  mergeUsersInputSchema,
  type MutationResult,
} from "@sunschool/domain";
import { reassignAuditActorsForUserMerge, writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { anonymizeUserInTransaction } from "./anonymize-user.server";
import { userHasAdminRole } from "./access-admin-guards.server";
import { mutationFromZodError } from "./map-zod-fields";

type LockedUser = { id: string; status: string; organizationId: string };

async function lockUsersInOrder(
  tx: Prisma.TransactionClient,
  keepUserId: string,
  mergeUserId: string,
): Promise<[LockedUser, LockedUser] | null> {
  const [firstId, secondId] = keepUserId < mergeUserId ? [keepUserId, mergeUserId] : [mergeUserId, keepUserId];
  const rows = await tx.$queryRaw<LockedUser[]>`
    SELECT id, status, organization_id AS "organizationId"
    FROM app_user
    WHERE id IN (${firstId}::uuid, ${secondId}::uuid)
    ORDER BY id
    FOR UPDATE
  `;
  if (rows.length !== 2) return null;
  const keep = rows.find((row) => row.id === keepUserId);
  const merge = rows.find((row) => row.id === mergeUserId);
  if (!keep || !merge) return null;
  return [keep, merge];
}

/** Merge duplicate users (access_requests §5.9). */
export async function mergeUsers(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = mergeUsersInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const locked = await lockUsersInOrder(tx, parsed.data.keepUserId, parsed.data.mergeUserId);
    if (!locked) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const [keep, merge] = locked;
    if (keep.status === ACCOUNT_STATUS.DELETED || merge.status === ACCOUNT_STATUS.DELETED) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const mergeIsAdmin = await userHasAdminRole(tx, merge.id);
    const keepIsAdmin = await userHasAdminRole(tx, keep.id);
    if (mergeIsAdmin && !keepIsAdmin) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.ACCESS_ROLE_UNAVAILABLE,
        message: "admin.users.merge_admin_forbidden",
      };
    }

    const identities = await tx.loginIdentity.findMany({ where: { userId: merge.id } });
    for (const identity of identities) {
      try {
        await tx.loginIdentity.update({
          where: { id: identity.id },
          data: { userId: keep.id },
        });
      } catch {
        return { ok: false, code: MUTATION_ERROR_CODES.CONFLICT, message: "common.errors.conflict" };
      }
    }

    const mergeRoles = await tx.userRoleAssignment.findMany({ where: { userId: merge.id } });
    for (const entry of mergeRoles) {
      await tx.userRoleAssignment.upsert({
        where: { userId_role: { userId: keep.id, role: entry.role } },
        create: { userId: keep.id, role: entry.role },
        update: {},
      });
    }

    const mergeAssignments = await tx.teacherAssignment.findMany({ where: { userId: merge.id } });
    for (const assignment of mergeAssignments) {
      const exists = await tx.teacherAssignment.findUnique({
        where: {
          userId_gradeId_academicYearId: {
            userId: keep.id,
            gradeId: assignment.gradeId,
            academicYearId: assignment.academicYearId,
          },
        },
      });
      if (exists) {
        await tx.teacherAssignment.delete({ where: { id: assignment.id } });
      } else {
        await tx.teacherAssignment.update({
          where: { id: assignment.id },
          data: { userId: keep.id },
        });
      }
    }

    await tx.lesson.updateMany({ where: { leadTeacherId: merge.id }, data: { leadTeacherId: keep.id } });
    await tx.homeworkCheck.updateMany({ where: { checkedById: merge.id }, data: { checkedById: keep.id } });
    await tx.brickLedger.updateMany({ where: { issuedById: merge.id }, data: { issuedById: keep.id } });
    await reassignAuditActorsForUserMerge(tx, merge.id, keep.id);

    await anonymizeUserInTransaction(tx, merge.id, merge.organizationId);

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.APP_USER,
      entityId: keep.id,
      action: AUDIT_ACTION.ACCESS_USERS_MERGED,
      newValue: { keepUserId: keep.id, mergeUserId: merge.id },
    });

    return { ok: true };
  });
}
