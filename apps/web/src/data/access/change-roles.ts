import "server-only";
import {
  ACCOUNT_STATUS,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  USER_ROLE,
  changeRolesInputSchema,
  parentRoleUnavailableIfRequested,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type PrismaClient } from "@sunschool/db";
import {
  assertNotLastAdmin,
  assertNotSelfAdmin,
  isMutationErr,
  loadTargetAppUser,
  lockAdminRoleRows,
  lockAppUserRow,
  userHasAdminRole,
} from "./access-admin-guards.server";
import { validateGradeIdsForActiveYear } from "./active-academic-year.server";
import { mutationFromZodError } from "./map-zod-fields";
import { replaceUserRoles, syncTeacherAssignmentsForActiveYear } from "./sync-teacher-assignments.server";

/** Role changes for an `ACTIVE` user (access_requests §5.6). */
export async function changeRoles(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = changeRolesInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const parentUnavailable = parentRoleUnavailableIfRequested(parsed.data.roles);
  if (parentUnavailable) return parentUnavailable;

  return db.$transaction(async (tx) => {
    await lockAdminRoleRows(tx);

    const target = await loadTargetAppUser(tx, parsed.data.userId);
    if (isMutationErr(target)) return target;
    if (target.status !== ACCOUNT_STATUS.ACTIVE) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.ACCESS_STATUS_INVALID,
        message: "auth.errors.status_invalid",
      };
    }

    const hadAdmin = await userHasAdminRole(tx, parsed.data.userId);
    const willHaveAdmin = parsed.data.roles.includes(USER_ROLE.ADMIN);

    if (hadAdmin && !willHaveAdmin) {
      const self = assertNotSelfAdmin(actorUserId, parsed.data.userId);
      if (self) return self;
      const last = await assertNotLastAdmin(tx, parsed.data.userId, false);
      if (last) return last;
    }

    const gradeError = await validateGradeIdsForActiveYear(tx, target.organizationId, parsed.data.gradeIds);
    if (gradeError) return gradeError;

    await lockAppUserRow(tx, parsed.data.userId);

    const previousRoles = await tx.userRoleAssignment.findMany({
      where: { userId: parsed.data.userId },
      select: { role: true },
    });

    await replaceUserRoles(tx, parsed.data.userId, parsed.data.roles);
    await syncTeacherAssignmentsForActiveYear(
      tx,
      parsed.data.userId,
      target.organizationId,
      parsed.data.roles,
      parsed.data.gradeIds,
    );

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.APP_USER,
      entityId: parsed.data.userId,
      action: AUDIT_ACTION.ACCESS_ROLES_CHANGED,
      oldValue: { roles: previousRoles.map((entry) => entry.role) },
      newValue: { roles: parsed.data.roles, gradeIds: parsed.data.gradeIds },
    });

    return { ok: true };
  });
}
