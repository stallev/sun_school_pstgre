import type { Prisma } from "../generated/prisma/client";
import { DELETION_PRIVILEGED_GUC } from "./constants";

/** Enables privileged deletion SQL for the current transaction only (R-6). */
export async function setDeletionPrivilegedContext(tx: Prisma.TransactionClient): Promise<void> {
  await tx.$executeRawUnsafe(`SELECT set_config('${DELETION_PRIVILEGED_GUC}', '1', true)`);
}

export async function withDeletionPrivilegedContext<T>(
  tx: Prisma.TransactionClient,
  run: () => Promise<T>,
): Promise<T> {
  await setDeletionPrivilegedContext(tx);
  return run();
}
