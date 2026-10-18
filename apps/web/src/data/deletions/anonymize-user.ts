import "server-only";

import { ACCOUNT_STATUS } from "@sunschool/domain";
import { scrubAuditLogForUserPrivileged, type Prisma } from "@sunschool/db";

type Tx = Prisma.TransactionClient;

export type AnonymizeUserResult = {
  deletedOrdinal: number;
};

/** Adult account anonymization (deletion_requests_contract §6.1). */
export async function anonymizeUserInTransaction(
  tx: Tx,
  userId: string,
  organizationId: string,
): Promise<AnonymizeUserResult> {
  await tx.loginIdentity.deleteMany({ where: { userId } });
  await tx.userRoleAssignment.deleteMany({ where: { userId } });
  await tx.teacherAssignment.deleteMany({ where: { userId } });

  await tx.accessRequest.updateMany({
    where: { userId },
    data: { fullNameSnapshot: "" },
  });

  const aggregate = await tx.appUser.aggregate({
    where: { organizationId, deletedOrdinal: { not: null } },
    _max: { deletedOrdinal: true },
  });
  const deletedOrdinal = (aggregate._max.deletedOrdinal ?? 0) + 1;

  await tx.appUser.update({
    where: { id: userId },
    data: {
      lastName: null,
      firstName: null,
      middleName: null,
      email: null,
      status: ACCOUNT_STATUS.DELETED,
      deletedOrdinal,
    },
  });

  await scrubAuditLogForUserPrivileged(tx, userId);

  return { deletedOrdinal };
}
