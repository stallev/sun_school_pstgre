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
