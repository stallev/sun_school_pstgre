import { Prisma } from "../generated/prisma/client";
import { DELETION_PRIVILEGED_SQL_FUNCTIONS } from "./constants";
import { setDeletionPrivilegedContext } from "./privileged-context";

type CountRow = { count: bigint };

/** Clears `reason` on audit rows where the user was actor (deletion_requests §6.1, INV-16). */
export async function scrubAuditLogForUserPrivileged(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<number> {
  await setDeletionPrivilegedContext(tx);
  const fn = DELETION_PRIVILEGED_SQL_FUNCTIONS.SCRUB_AUDIT_LOG_FOR_USER;
  const rows = await tx.$queryRaw<CountRow[]>(
    Prisma.sql`SELECT ${Prisma.raw(fn)}(CAST(${userId} AS uuid)) AS count`,
  );
  const count = rows[0]?.count ?? 0n;
  return Number(count);
}
