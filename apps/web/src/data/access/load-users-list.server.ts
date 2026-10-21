import "server-only";
import { ACCOUNT_STATUS, USER_ROLE, type AccountStatus, type UserRole } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { formatDisplayName } from "@/lib/person/format-display-name";

export type UserListRow = {
  userId: string;
  displayName: string;
  status: AccountStatus;
  roles: UserRole[];
};

const LISTABLE_STATUSES: readonly AccountStatus[] = [
  ACCOUNT_STATUS.ACTIVE,
  ACCOUNT_STATUS.REQUEST_PENDING,
  ACCOUNT_STATUS.DISABLED,
  ACCOUNT_STATUS.REJECTED,
  ACCOUNT_STATUS.REGISTRATION,
];

export const parseUsersStatusFilter = (raw: string | undefined): AccountStatus | null => {
  if (!raw) return null;
  return LISTABLE_STATUSES.includes(raw as AccountStatus) ? (raw as AccountStatus) : null;
};

export type UsersStatusCounts = Record<AccountStatus, number> & { total: number };

export async function loadUsersStatusCounts(db: PrismaClient): Promise<UsersStatusCounts> {
  const groups = await db.appUser.groupBy({
    by: ["status"],
    where: { status: { in: [...LISTABLE_STATUSES] } },
    _count: { _all: true },
  });

  const counts = Object.fromEntries(
    LISTABLE_STATUSES.map((status) => [status, 0]),
  ) as Record<AccountStatus, number>;

  let total = 0;
  for (const group of groups) {
    counts[group.status] = group._count._all;
    total += group._count._all;
  }

  return { ...counts, total };
}

export async function loadUsersList(
  db: PrismaClient,
  statusFilter: AccountStatus | null,
): Promise<UserListRow[]> {
  const users = await db.appUser.findMany({
    where: {
      status: statusFilter ?? { in: [...LISTABLE_STATUSES] },
    },
    orderBy: [{ status: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      status: true,
      lastName: true,
      firstName: true,
      middleName: true,
      roles: { select: { role: true } },
    },
  });

  return users.map((user) => ({
    userId: user.id,
    displayName: formatDisplayName(user),
    status: user.status,
    roles: user.roles
      .map((assignment) => assignment.role)
      .filter((role): role is UserRole => role === USER_ROLE.ADMIN || role === USER_ROLE.TEACHER),
  }));
}
