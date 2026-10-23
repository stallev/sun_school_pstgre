import "server-only";

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  canRemoveFamilyAdult,
  warningAfterRemoveAdult,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { loadActorOrganizationId } from "../school/school-pupil-shared.server";
import { assertFamilyMutateAccess } from "./family-mutate-access.server";
import { removeFamilyAdultInputSchema } from "./family-schemas";

type Tx = Prisma.TransactionClient;

export async function removeFamilyAdultInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: ReturnType<typeof removeFamilyAdultInputSchema.parse>,
): Promise<MutationResult<undefined>> {
  const adult = await tx.familyAdult.findUnique({
    where: { id: input.adultId },
    select: {
      id: true,
      familyId: true,
      family: { select: { organizationId: true } },
    },
  });
  if (!adult || adult.family.organizationId !== organizationId) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const accessError = await assertFamilyMutateAccess(tx, actorUserId, organizationId, adult.familyId);
  if (accessError) return accessError;

  const removeError = canRemoveFamilyAdult();
  if (removeError) return removeError;

  const remaining = await tx.familyAdult.count({ where: { familyId: adult.familyId } });
  const warning = warningAfterRemoveAdult(remaining - 1);

  await tx.familyAdult.delete({ where: { id: adult.id } });

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.FAMILY_ADULT,
    entityId: adult.id,
    action: AUDIT_ACTION.FAMILY_ADULT_CHANGED,
    newValue: { adultId: adult.id, familyId: adult.familyId, change: "removed" },
  });

  return warning ? { ok: true, warnings: [warning] } : { ok: true };
}

export async function removeFamilyAdult(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<undefined>> {
  const parsed = removeFamilyAdultInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    const result = await removeFamilyAdultInTransaction(tx, actorUserId, organizationId, parsed.data);
    if (isMutationErr(result)) return result;
    return result;
  });
}
