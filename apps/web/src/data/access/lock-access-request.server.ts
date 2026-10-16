import "server-only";
import type { AccessRequestStatus } from "@sunschool/domain";
import type { Prisma } from "@sunschool/db";

type Tx = Prisma.TransactionClient;

export type LockedAccessRequest = {
  id: string;
  status: AccessRequestStatus;
  userId: string;
};

/** Row lock for approve/reject races (access_requests §8). */
export async function lockAccessRequest(tx: Tx, requestId: string): Promise<LockedAccessRequest | null> {
  const rows = await tx.$queryRaw<LockedAccessRequest[]>`
    SELECT id, status, user_id AS "userId"
    FROM access_request
    WHERE id = ${requestId}::uuid
    FOR UPDATE
  `;
  return rows[0] ?? null;
}
