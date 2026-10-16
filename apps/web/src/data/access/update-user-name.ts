import "server-only";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  updateUserNameInputSchema,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type PrismaClient } from "@sunschool/db";
import { isMutationErr, loadTargetAppUser, lockAppUserRow } from "./access-admin-guards.server";
import { listChangedNameFields, nameAuditPayload } from "./name-field-audit";
import { mutationFromZodError } from "./map-zod-fields";

/** Admin edits user ФИО (access_requests §5.8). */
export async function updateUserName(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = updateUserNameInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const target = await loadTargetAppUser(tx, parsed.data.userId);
    if (isMutationErr(target)) return target;

    await lockAppUserRow(tx, parsed.data.userId);

    const before = await tx.appUser.findUnique({
      where: { id: parsed.data.userId },
      select: { lastName: true, firstName: true, middleName: true },
    });
    if (!before) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const changedFields = listChangedNameFields(before, parsed.data);
    if (changedFields.length === 0) return { ok: true };

    await tx.appUser.update({
      where: { id: parsed.data.userId },
      data: {
        lastName: parsed.data.lastName,
        firstName: parsed.data.firstName,
        middleName: parsed.data.middleName ?? null,
      },
    });

    const payload = nameAuditPayload(changedFields);
    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.APP_USER,
      entityId: parsed.data.userId,
      action: AUDIT_ACTION.ACCESS_NAME_CHANGED,
      oldValue: payload,
      newValue: payload,
      reason: parsed.data.reason ?? null,
    });

    return { ok: true };
  });
}
