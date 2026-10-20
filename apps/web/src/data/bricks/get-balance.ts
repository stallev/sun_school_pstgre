import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import type { BricksBalanceSnapshot } from "@sunschool/domain";
import type { MutationResult } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getPrisma } from "@/lib/db.server";
import {
  assertBricksReadAccess,
  loadBricksBalanceInTransaction,
  loadOrganizationIdForActor,
} from "./bricks-shared.server";

async function loadBricksBalanceFromDb(
  db: PrismaClient,
  pupilId: string,
  yearId: string,
): Promise<BricksBalanceSnapshot> {
  return db.$transaction((tx) => loadBricksBalanceInTransaction(tx, pupilId, yearId));
}

async function loadCachedBricksBalance(
  pupilId: string,
  yearId: string,
): Promise<BricksBalanceSnapshot> {
  "use cache";
  cacheTag(CACHE_TAGS.bricksBalance(pupilId, yearId));
  cacheLife("minutes");
  const db = await getPrisma();
  return loadBricksBalanceFromDb(db, pupilId, yearId);
}

export async function getBalance(
  db: PrismaClient,
  actorUserId: string,
  pupilId: string,
  yearId: string,
): Promise<MutationResult<BricksBalanceSnapshot>> {
  const access = await db.$transaction(async (tx) => {
    const organizationId = await loadOrganizationIdForActor(tx, actorUserId);
    if (isMutationErr(organizationId)) return organizationId;
    return assertBricksReadAccess(tx, actorUserId, organizationId, pupilId, yearId);
  });
  if (isMutationErr(access)) return access;

  const data = await loadCachedBricksBalance(pupilId, yearId);
  return { ok: true, data };
}
