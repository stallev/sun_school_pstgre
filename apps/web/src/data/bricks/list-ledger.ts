import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import type { MutationResult } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  assertBricksReadAccess,
  loadOrganizationIdForActor,
  mapBrickLedgerRow,
  type BrickLedgerEntryDto,
} from "./bricks-shared.server";

async function loadCachedBrickLedger(
  db: PrismaClient,
  pupilId: string,
  yearId: string,
): Promise<BrickLedgerEntryDto[]> {
  "use cache";
  cacheTag(CACHE_TAGS.bricksLedger(pupilId, yearId));
  cacheLife("minutes");

  const rows = await db.brickLedger.findMany({
    where: { pupilId, academicYearId: yearId },
    orderBy: [{ issuedOn: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      quantity: true,
      issuedOn: true,
      note: true,
      createdAt: true,
      issuedBy: {
        select: { lastName: true, firstName: true, middleName: true },
      },
    },
  });
  return rows.map(mapBrickLedgerRow);
}

export async function listLedger(
  db: PrismaClient,
  actorUserId: string,
  pupilId: string,
  yearId: string,
): Promise<MutationResult<BrickLedgerEntryDto[]>> {
  const access = await db.$transaction(async (tx) => {
    const organizationId = await loadOrganizationIdForActor(tx, actorUserId);
    if (isMutationErr(organizationId)) return organizationId;
    return assertBricksReadAccess(tx, actorUserId, organizationId, pupilId, yearId);
  });
  if (isMutationErr(access)) return access;

  const data = await loadCachedBrickLedger(db, pupilId, yearId);
  return { ok: true, data };
}
