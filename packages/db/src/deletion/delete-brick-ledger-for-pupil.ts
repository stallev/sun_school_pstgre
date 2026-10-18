import { Prisma } from "../generated/prisma/client";
import { DELETION_PRIVILEGED_SQL_FUNCTIONS } from "./constants";
import { setDeletionPrivilegedContext } from "./privileged-context";

type CountRow = { count: bigint };

/**
 * Deletes all `brick_ledger` rows for a pupil (INV-17 exception). Requires privileged context.
 * Returns 0 when the pupil row does not exist.
 */
export async function deleteBrickLedgerForPupilPrivileged(
  tx: Prisma.TransactionClient,
  pupilId: string,
): Promise<number> {
  await setDeletionPrivilegedContext(tx);
  const fn = DELETION_PRIVILEGED_SQL_FUNCTIONS.DELETE_BRICK_LEDGER_FOR_PUPIL;
  const rows = await tx.$queryRaw<CountRow[]>(
    Prisma.sql`SELECT ${Prisma.raw(fn)}(CAST(${pupilId} AS uuid)) AS count`,
  );
  const count = rows[0]?.count ?? 0n;
  return Number(count);
}
