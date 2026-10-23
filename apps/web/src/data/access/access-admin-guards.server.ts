import "server-only";
import {
  ACCOUNT_STATUS,
  MUTATION_ERROR_CODES,
  USER_ROLE,
  type MutationErr,
  type MutationResult,
} from "@sunschool/domain";
import type { Prisma } from "@sunschool/db";

type Tx = Prisma.TransactionClient;

export async function lockAdminRoleRows(tx: Tx): Promise<void> {
  await tx.$queryRaw`SELECT id FROM user_role WHERE role = ${USER_ROLE.ADMIN} FOR UPDATE`;
}

export async function countAdminRoles(tx: Tx): Promise<number> {
  return tx.userRoleAssignment.count({ where: { role: USER_ROLE.ADMIN } });
}

export async function userHasAdminRole(tx: Tx, userId: string): Promise<boolean> {
  const row = await tx.userRoleAssignment.findFirst({
    where: { userId, role: USER_ROLE.ADMIN },
    select: { id: true },
  });
  return row !== null;
}

export async function userHasParentRole(tx: Tx, userId: string): Promise<boolean> {
  const row = await tx.userRoleAssignment.findFirst({
    where: { userId, role: USER_ROLE.PARENT },
    select: { id: true },
  });
  return row !== null;
}

export function assertNotSelfAdmin(actorUserId: string, targetUserId: string): MutationErr | null {
  if (actorUserId === targetUserId) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.ACCESS_SELF_FORBIDDEN,
      message: "admin.users.self_forbidden",
    };
  }
  return null;
}

export async function assertNotLastAdmin(
  tx: Tx,
  targetUserId: string,
  targetWillRetainAdmin: boolean,
): Promise<MutationErr | null> {
  const isAdmin = await userHasAdminRole(tx, targetUserId);
  if (!isAdmin || targetWillRetainAdmin) return null;

  const adminCount = await countAdminRoles(tx);
  if (adminCount <= 1) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.ACCESS_LAST_ADMIN,
      message: "admin.users.last_admin",
    };
  }
  return null;
}

export async function loadTargetAppUser(
  tx: Tx,
  userId: string,
): Promise<{ id: string; status: string; organizationId: string } | MutationErr> {
  const user = await tx.appUser.findUnique({
    where: { id: userId },
    select: { id: true, status: true, organizationId: true },
  });
  if (!user || user.status === ACCOUNT_STATUS.DELETED) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  return user;
}

export async function lockAppUserRow(tx: Tx, userId: string): Promise<boolean> {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM app_user WHERE id = ${userId}::uuid FOR UPDATE
  `;
  return rows.length > 0;
}

export function isMutationErr(value: unknown): value is MutationErr {
  return typeof value === "object" && value !== null && (value as MutationResult).ok === false;
}
