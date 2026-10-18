import "server-only";

import { ACCOUNT_STATUS } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { formatAppUserDisplayName } from "@/lib/person/format-display-name";

export async function loadAuditActorOptions(
  db: PrismaClient,
  deletedUserTemplate: string,
): Promise<{ userId: string; label: string }[]> {
  const users = await db.appUser.findMany({
    where: {
      status: { in: [ACCOUNT_STATUS.ACTIVE, ACCOUNT_STATUS.DISABLED, ACCOUNT_STATUS.DELETED] },
      auditEntries: { some: {} },
    },
    select: {
      id: true,
      status: true,
      deletedOrdinal: true,
      firstName: true,
      lastName: true,
      middleName: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 200,
  });

  return users.map((user) => ({
    userId: user.id,
    label: formatAppUserDisplayName(user, deletedUserTemplate) || user.id.slice(0, 8),
  }));
}
