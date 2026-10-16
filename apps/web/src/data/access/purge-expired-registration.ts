import "server-only";
import { ACCOUNT_STATUS, AUDIT_ACTION, AUDIT_ENTITY_TYPE, AUDIT_SOURCE, REGISTRATION_TTL_DAYS } from "@sunschool/domain";
import { writeAudit, type Prisma } from "@sunschool/db";

/**
 * Lazy purge of abandoned registrations (access_requests §5.10, lifecycle_models §5.1, INV-25:
 * there is no cron). A `REGISTRATION` user has no consent, request or roles, so the delete is
 * plain: identities, then the user; one `SYSTEM` audit record without personal data (INV-23).
 */
type Tx = Prisma.TransactionClient;

/** Removes one `REGISTRATION` user; a user in any other status is left untouched (returns false). */
export async function purgeRegistration(tx: Tx, userId: string): Promise<boolean> {
  const user = await tx.appUser.findUnique({ where: { id: userId }, select: { status: true } });
  if (!user || user.status !== ACCOUNT_STATUS.REGISTRATION) return false;
  await tx.loginIdentity.deleteMany({ where: { userId } });
  await tx.appUser.delete({ where: { id: userId } });
  await writeAudit(tx, {
    actorUserId: null,
    source: AUDIT_SOURCE.SYSTEM,
    entityType: AUDIT_ENTITY_TYPE.APP_USER,
    entityId: userId,
    action: AUDIT_ACTION.ACCESS_REGISTRATION_PURGED,
  });
  return true;
}

/** Purges every expired `REGISTRATION` (called when the admin screens open — CU9/CU10). */
export async function purgeExpiredRegistrations(tx: Tx, now: Date): Promise<number> {
  const cutoff = new Date(now.getTime() - REGISTRATION_TTL_DAYS * 24 * 60 * 60 * 1000);
  const expired = await tx.appUser.findMany({
    where: { status: ACCOUNT_STATUS.REGISTRATION, firstLoginAt: { lt: cutoff } },
    select: { id: true },
  });
  let purged = 0;
  for (const { id } of expired) {
    if (await purgeRegistration(tx, id)) purged += 1;
  }
  return purged;
}
