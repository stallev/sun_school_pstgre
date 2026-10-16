import "server-only";
import {
  ACCOUNT_STATUS,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  userIdInputSchema,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type PrismaClient } from "@sunschool/db";
import { isMutationErr, loadTargetAppUser, lockAppUserRow } from "./access-admin-guards.server";
import { mutationFromZodError } from "./map-zod-fields";

/** `DISABLED → ACTIVE` (access_requests §5.7). */
export async function enableAccess(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = userIdInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const target = await loadTargetAppUser(tx, parsed.data.userId);
    if (isMutationErr(target)) return target;
    if (target.status !== ACCOUNT_STATUS.DISABLED) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.ACCESS_STATUS_INVALID,
        message: "auth.errors.status_invalid",
      };
    }

    await lockAppUserRow(tx, parsed.data.userId);

    await tx.appUser.update({
      where: { id: parsed.data.userId },
      data: { status: ACCOUNT_STATUS.ACTIVE },
    });

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.APP_USER,
      entityId: parsed.data.userId,
      action: AUDIT_ACTION.ACCESS_ENABLED,
    });

    return { ok: true };
  });
}
