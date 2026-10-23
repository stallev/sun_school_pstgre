import "server-only";

import { MUTATION_ERROR_CODES, type DeletionRequestStatus } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { OPEN_DELETION_STATUSES } from "../deletions/deletion-shared.server";
import { loadFamilyAdultForPupilRead } from "./parent-consent-access.server";

export type OpenChildDeletionForFamilyView = {
  requestId: string;
  status: DeletionRequestStatus;
  requestedAt: Date;
  dueOn: string;
  requestedByCurrentUser: boolean;
};

/** families §6.4 — family adults with accounts see an open child deletion request on screen data. */
export async function loadOpenChildDeletionForFamily(
  db: PrismaClient,
  actorUserId: string,
  pupilId: string,
): Promise<OpenChildDeletionForFamilyView | null> {
  const access = await db.$transaction((tx) => loadFamilyAdultForPupilRead(tx, actorUserId, pupilId));
  if (isMutationErr(access)) {
    if (access.code === MUTATION_ERROR_CODES.FAMILY_FLAG_OFF) return null;
    return null;
  }

  const row = await db.deletionRequest.findFirst({
    where: {
      subjectPupilId: pupilId,
      status: { in: [...OPEN_DELETION_STATUSES] },
    },
    select: {
      id: true,
      status: true,
      requestedAt: true,
      dueOn: true,
      requestedById: true,
    },
  });

  if (!row) return null;

  const dueOn =
    row.dueOn instanceof Date
      ? row.dueOn.toISOString().slice(0, 10)
      : String(row.dueOn).slice(0, 10);

  return {
    requestId: row.id,
    status: row.status as DeletionRequestStatus,
    requestedAt: row.requestedAt,
    dueOn,
    requestedByCurrentUser: row.requestedById === actorUserId,
  };
}
