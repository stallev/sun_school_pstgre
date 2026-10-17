import "server-only";

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  canIssue,
  parseIssueBricksInput,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { isoTodayUtc } from "../school/school-pupil-shared.server";
import {
  assertBricksMutateAccess,
  findIdempotentBrickLedgerId,
  issuedOnDate,
  loadBricksBalanceInTransaction,
  loadOrganizationIdForActor,
  lockPupilForBricks,
} from "./bricks-shared.server";
import { revalidateBricksCaches } from "./revalidate-bricks-cache";

export async function issueBricks(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<{ ledgerId: string }>> {
  const today = isoTodayUtc();
  const parsed = parseIssueBricksInput(raw, today);
  if (!parsed.success) return mutationFromZodError(parsed.error);
  const input = parsed.data;
  const issuedOnIso = input.issuedOn ?? today;

  const result = await db.$transaction(async (tx) => {
    const organizationId = await loadOrganizationIdForActor(tx, actorUserId);
    if (isMutationErr(organizationId)) return organizationId;

    const access = await assertBricksMutateAccess(
      tx,
      actorUserId,
      organizationId,
      input.pupilId,
      input.yearId,
    );
    if (access) return access;

    const lockError = await lockPupilForBricks(tx, input.pupilId, organizationId);
    if (lockError) return lockError;

    if (input.requestId) {
      const existingId = await findIdempotentBrickLedgerId(tx, input.requestId, AUDIT_ACTION.BRICKS_ISSUED);
      if (existingId) {
        return { ok: true as const, data: { ledgerId: existingId } };
      }
    }

    const balance = await loadBricksBalanceInTransaction(tx, input.pupilId, input.yearId);
    const ruleError = canIssue({
      earned: balance.earned,
      issued: balance.issued,
      quantity: input.quantity,
    });
    if (ruleError) return ruleError;

    const entry = await tx.brickLedger.create({
      data: {
        pupilId: input.pupilId,
        academicYearId: input.yearId,
        quantity: input.quantity,
        issuedOn: issuedOnDate(issuedOnIso),
        issuedById: actorUserId,
        note: input.note ?? null,
      },
      select: { id: true },
    });

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.BRICK_LEDGER,
      entityId: entry.id,
      action: AUDIT_ACTION.BRICKS_ISSUED,
      requestId: input.requestId ?? null,
      newValue: {
        pupilId: input.pupilId,
        academicYearId: input.yearId,
        quantity: input.quantity,
      },
    });

    return { ok: true as const, data: { ledgerId: entry.id } };
  });

  if (!result.ok) return result;
  revalidateBricksCaches(parsed.data.pupilId, parsed.data.yearId);
  return result;
}
