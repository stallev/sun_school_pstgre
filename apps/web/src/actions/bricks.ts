"use server";

import { revalidatePath } from "next/cache";
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

const revalidateBricksPage = () => {
  revalidatePath("/bricks");
};

export async function issueBricksFormAction(
  _prev: MutationResult<{ ledgerId: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ ledgerId: string }>> {
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const noteRaw = String(formData.get("note") ?? "").trim();
  const issuedOnRaw = String(formData.get("issuedOn") ?? "").trim();
  const requestIdRaw = String(formData.get("requestId") ?? "").trim();
  const result = await issueBricks(await getPrisma(), actor.userId, {
    pupilId: String(formData.get("pupilId") ?? ""),
    yearId: String(formData.get("yearId") ?? ""),
    quantity: Number(formData.get("quantity")),
    issuedOn: issuedOnRaw.length > 0 ? issuedOnRaw : undefined,
    note: noteRaw.length > 0 ? noteRaw : undefined,
    requestId: requestIdRaw.length > 0 ? requestIdRaw : undefined,
  });
  if (result.ok) revalidateBricksPage();
  return result;
}

export async function compensateBricksFormAction(
  _prev: MutationResult<{ ledgerId: string }> | null,
  formData: FormData,
): Promise<MutationResult<{ ledgerId: string }>> {
  const actor = await requireRole(USER_ROLE.TEACHER, USER_ROLE.ADMIN);
  const noteRaw = String(formData.get("note") ?? "").trim();
  const issuedOnRaw = String(formData.get("issuedOn") ?? "").trim();
  const requestIdRaw = String(formData.get("requestId") ?? "").trim();
  const quantityRaw = Number(formData.get("quantity"));
  const quantity = quantityRaw > 0 ? -quantityRaw : quantityRaw;
  const result = await compensateBricks(await getPrisma(), actor.userId, {
    pupilId: String(formData.get("pupilId") ?? ""),
    yearId: String(formData.get("yearId") ?? ""),
    quantity,
    note: noteRaw,
    issuedOn: issuedOnRaw.length > 0 ? issuedOnRaw : undefined,
    requestId: requestIdRaw.length > 0 ? requestIdRaw : undefined,
  });
  if (result.ok) revalidateBricksPage();
  return result;
}
