import "server-only";

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  canSetAdultRelation,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { loadActorOrganizationId } from "../school/school-pupil-shared.server";
import { assertFamilyMutateAccess } from "./family-mutate-access.server";
import { mapFamilyPrismaError } from "./family-prisma-errors";
import { updateFamilyAdultInputSchema } from "./family-schemas";

type Tx = Prisma.TransactionClient;

export async function updateFamilyAdultInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: ReturnType<typeof updateFamilyAdultInputSchema.parse>,
): Promise<MutationResult<{ adultId: string }>> {
  const adult = await tx.familyAdult.findUnique({
    where: { id: input.adultId },
    select: {
      id: true,
      familyId: true,
      relation: true,
      family: { select: { organizationId: true } },
    },
  });
  if (!adult || adult.family.organizationId !== organizationId) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const accessError = await assertFamilyMutateAccess(tx, actorUserId, organizationId, adult.familyId);
  if (accessError) return accessError;

  const adults = await tx.familyAdult.findMany({
    where: { familyId: adult.familyId },
    select: { id: true, relation: true },
  });
  const replaceIndex = adults.findIndex((row) => row.id === adult.id);
  const relations = adults.map((row) => row.relation);
  const relationError = canSetAdultRelation(relations, input.relation, replaceIndex);
  if (relationError) return relationError;

  try {
    await tx.familyAdult.update({
      where: { id: adult.id },
      data: {
        relation: input.relation,
        lastName: input.lastName,
        firstName: input.firstName,
        middleName: input.middleName ?? null,
        phones: input.phones,
        email: input.email ?? null,
        userId: input.userId === undefined ? undefined : input.userId,
      },
    });

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.FAMILY_ADULT,
      entityId: adult.id,
      action: AUDIT_ACTION.FAMILY_ADULT_CHANGED,
      newValue: { adultId: adult.id, familyId: adult.familyId, change: "updated", relation: input.relation },
    });

    return { ok: true, data: { adultId: adult.id } };
  } catch (error) {
    const mapped = mapFamilyPrismaError(error);
    if (mapped) return mapped;
    throw error;
  }
}

export async function updateFamilyAdult(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<{ adultId: string }>> {
  const parsed = updateFamilyAdultInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    const result = await updateFamilyAdultInTransaction(tx, actorUserId, organizationId, parsed.data);
    if (isMutationErr(result)) return result;
    return result;
  });
}
