import "server-only";
import {
  ACCESS_REQUEST_STATUS,
  ACCOUNT_STATUS,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  rejectRequestInputSchema,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type PrismaClient } from "@sunschool/db";
import { lockAppUserRow } from "./access-admin-guards.server";
import { lockAccessRequest } from "./lock-access-request.server";
import { mutationFromZodError } from "./map-zod-fields";

/** `REQUEST_PENDING → REJECTED` (access_requests §5.5). */
export async function rejectRequest(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
  now: Date,
): Promise<MutationResult> {
  const parsed = rejectRequestInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const locked = await lockAccessRequest(tx, parsed.data.requestId);
    if (!locked) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    if (locked.status !== ACCESS_REQUEST_STATUS.PENDING) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.ACCESS_REQUEST_DECIDED,
        message: "admin.approvals.already_decided",
      };
    }

    const hasUser = await lockAppUserRow(tx, locked.userId);
    if (!hasUser) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const user = await tx.appUser.findUnique({
      where: { id: locked.userId },
      select: { status: true },
    });
    if (!user || user.status !== ACCOUNT_STATUS.REQUEST_PENDING) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.ACCESS_STATUS_INVALID,
        message: "auth.errors.status_invalid",
      };
    }

    await tx.accessRequest.update({
      where: { id: locked.id },
      data: {
        status: ACCESS_REQUEST_STATUS.REJECTED,
        rejectReason: parsed.data.reason,
        decidedById: actorUserId,
        decidedAt: now,
      },
    });

    await tx.appUser.update({
      where: { id: locked.userId },
      data: { status: ACCOUNT_STATUS.REJECTED },
    });

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.ACCESS_REQUEST,
      entityId: locked.id,
      action: AUDIT_ACTION.ACCESS_REQUEST_REJECTED,
      reason: parsed.data.reason,
    });

    return { ok: true };
  });
}
