import "server-only";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  extendLegacyDeadlineInputSchema,
  validateExtendLegacyDeadline,
  type ExtendLegacyDeadlineInput,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { mutationFromZodError } from "../access/map-zod-fields";
import { LEGACY_CONSENT_DEADLINE_KEY } from "./list-legacy-pending";
import { assertAdminActor } from "./school-enrollment-shared.server";
import { loadActorOrganizationId } from "./school-pupil-shared.server";

type Tx = Prisma.TransactionClient;

export async function extendLegacyDeadlineInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: ExtendLegacyDeadlineInput,
): Promise<MutationResult<{ deadlineOn: string }>> {
  const adminError = await assertAdminActor(tx, actorUserId);
  if (adminError) return adminError;

  const org = await tx.organization.findUnique({
    where: { id: organizationId },
    select: { id: true },
  });
  if (!org) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const legacyRow = await tx.appSetting.findUnique({
    where: { key: LEGACY_CONSENT_DEADLINE_KEY },
    select: { value: true },
  });
  const currentDeadlineOn =
    legacyRow?.value && typeof legacyRow.value === "string" ? legacyRow.value : null;
  const validationError = validateExtendLegacyDeadline({
    currentDeadlineOn,
    newDeadlineOn: input.newDeadlineOn,
  });
  if (validationError) return validationError;

  await tx.appSetting.upsert({
    where: { key: LEGACY_CONSENT_DEADLINE_KEY },
    create: { key: LEGACY_CONSENT_DEADLINE_KEY, value: input.newDeadlineOn },
    update: { value: input.newDeadlineOn },
  });

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.APP_SETTING,
    entityId: LEGACY_CONSENT_DEADLINE_KEY,
    action: AUDIT_ACTION.SCHOOL_LEGACY_DEADLINE_EXTENDED,
    oldValue: { legacyConsentDeadlineOn: currentDeadlineOn },
    newValue: { legacyConsentDeadlineOn: input.newDeadlineOn },
    reason: input.reason,
  });

  return { ok: true, data: { deadlineOn: input.newDeadlineOn } };
}

export async function extendLegacyDeadline(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<{ deadlineOn: string }>> {
  const parsed = extendLegacyDeadlineInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    return extendLegacyDeadlineInTransaction(tx, actorUserId, organizationId, parsed.data);
  });
}
