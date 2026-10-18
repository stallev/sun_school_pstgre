import { Prisma } from "../generated/prisma/client";
import { DELETION_PRIVILEGED_SQL_FUNCTIONS } from "./constants";
import { setDeletionPrivilegedContext } from "./privileged-context";

type CountRow = { count: bigint };

/** Clears `old_value` / `new_value` / `reason` on audit rows about a pupil (INV-16 exception). */
export async function scrubAuditLogForPupilPrivileged(
  tx: Prisma.TransactionClient,
  pupilId: string,
): Promise<number> {
  await setDeletionPrivilegedContext(tx);
  const fn = DELETION_PRIVILEGED_SQL_FUNCTIONS.SCRUB_AUDIT_LOG_FOR_PUPIL;
  const rows = await tx.$queryRaw<CountRow[]>(
    Prisma.sql`SELECT ${Prisma.raw(fn)}(CAST(${pupilId} AS uuid)) AS count`,
  );
  const count = rows[0]?.count ?? 0n;
  return Number(count);
}
