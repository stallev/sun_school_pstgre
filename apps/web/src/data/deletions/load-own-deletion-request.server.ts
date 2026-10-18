import "server-only";

import type { DeletionRequestStatus } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { isoFromCalendarDate } from "@/data/school/calendar-date";
import { OPEN_DELETION_STATUSES } from "./deletion-shared.server";

export type OwnDeletionRequest = {
  requestId: string;
  status: DeletionRequestStatus;
  requestedAtIso: string;
  dueOnIso: string;
  reason: string | null;
};

export async function loadOwnDeletionRequest(
  db: PrismaClient,
  userId: string,
): Promise<OwnDeletionRequest | null> {
  const row = await db.deletionRequest.findFirst({
    where: {
      subjectUserId: userId,
      status: { in: [...OPEN_DELETION_STATUSES] },
    },
    orderBy: { requestedAt: "desc" },
    select: {
      id: true,
      status: true,
      requestedAt: true,
      dueOn: true,
      reason: true,
    },
  });
  if (!row) return null;
  return {
    requestId: row.id,
    status: row.status,
    requestedAtIso: row.requestedAt.toISOString(),
    dueOnIso: isoFromCalendarDate(row.dueOn),
    reason: row.reason,
  };
}
