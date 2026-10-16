import "server-only";
import {
  ACCOUNT_STATUS,
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  updateOwnNameInputSchema,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type PrismaClient } from "@sunschool/db";
import { listChangedNameFields, nameAuditPayload } from "./name-field-audit";
import { mutationFromZodError } from "./map-zod-fields";

const ALLOWED_STATUSES: ReadonlySet<string> = new Set([
  ACCOUNT_STATUS.REQUEST_PENDING,
  ACCOUNT_STATUS.REJECTED,
  ACCOUNT_STATUS.ACTIVE,
]);

/** User edits own ФИО (access_requests §5.8). */
export async function updateOwnName(
  db: PrismaClient,
  userId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = updateOwnNameInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const user = await tx.appUser.findUnique({
      where: { id: userId },
      select: { status: true, lastName: true, firstName: true, middleName: true },
    });
    if (!user) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    if (!ALLOWED_STATUSES.has(user.status)) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.ACCESS_STATUS_INVALID,
        message: "auth.errors.status_invalid",
      };
    }

    const changedFields = listChangedNameFields(user, parsed.data);
    if (changedFields.length === 0) {
      return { ok: true };
    }

    await tx.appUser.update({
      where: { id: userId },
      data: {
        lastName: parsed.data.lastName,
        firstName: parsed.data.firstName,
        middleName: parsed.data.middleName ?? null,
      },
    });

    const payload = nameAuditPayload(changedFields);
    await writeAudit(tx, {
      actorUserId: userId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.APP_USER,
      entityId: userId,
      action: AUDIT_ACTION.ACCESS_NAME_CHANGED,
      oldValue: payload,
      newValue: payload,
    });

    return { ok: true };
  });
}
