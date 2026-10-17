"use server";

import { USER_ROLE, type BricksBalanceSnapshot, type MutationResult } from "@sunschool/domain";
import { compensateBricks } from "@/data/bricks/compensate-bricks";
import { getBalance } from "@/data/bricks/get-balance";
import { issueBricks } from "@/data/bricks/issue-bricks";
import { listLedger } from "@/data/bricks/list-ledger";
import type { BrickLedgerEntryDto } from "@/data/bricks/bricks-shared.server";
import { requireRole } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db.server";

export async function getBalanceAction(
  pupilId: string,
  yearId: string,
): Promise<MutationResult<BricksBalanceSnapshot>> {
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  return getBalance(await getPrisma(), actor.userId, pupilId, yearId);
}

export async function listLedgerAction(
  pupilId: string,
  yearId: string,
): Promise<MutationResult<BrickLedgerEntryDto[]>> {
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  return listLedger(await getPrisma(), actor.userId, pupilId, yearId);
}

export async function issueBricksAction(
  raw: unknown,
): Promise<MutationResult<{ ledgerId: string }>> {
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  return issueBricks(await getPrisma(), actor.userId, raw);
}

export async function compensateBricksAction(
  raw: unknown,
): Promise<MutationResult<{ ledgerId: string }>> {
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  return compensateBricks(await getPrisma(), actor.userId, raw);
}
