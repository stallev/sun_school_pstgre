import type { Prisma } from "../generated/prisma/client";

/**
 * `access.users_merged` §5.9: re-point `actor_user_id` before anonymizing the duplicate.
 * Sole exception to audit_log append-only (R-6); do not reuse for other flows.
 */
export async function reassignAuditActorsForUserMerge(
  tx: Prisma.TransactionClient,
  fromUserId: string,
  toUserId: string,
): Promise<void> {
  await tx.$executeRaw`
    UPDATE audit_log SET actor_user_id = ${toUserId}::uuid WHERE actor_user_id = ${fromUserId}::uuid
  `;
}
