import "server-only";

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  canPersistFamily,
  canSetAdultRelation,
  type AdultRelation,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { loadActorOrganizationId } from "../school/school-pupil-shared.server";
import { assertFamilyCreateAccess, assertFamilyMutateAccess } from "./family-mutate-access.server";
import { mapFamilyPrismaError } from "./family-prisma-errors";
import { addFamilyAdultInputSchema } from "./family-schemas";

type Tx = Prisma.TransactionClient;

async function loadFamilyRelations(tx: Tx, familyId: string): Promise<AdultRelation[]> {
  const adults = await tx.familyAdult.findMany({
    where: { familyId },
    select: { relation: true },
  });
  return adults.map((row) => row.relation as AdultRelation);
}

export async function addFamilyAdultInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: ReturnType<typeof addFamilyAdultInputSchema.parse>,
): Promise<MutationResult<{ familyId: string; adultId: string }>> {
  let familyId = input.familyId;

  if (familyId) {
    const accessError = await assertFamilyMutateAccess(tx, actorUserId, organizationId, familyId);
    if (accessError) return accessError;
  } else {
    const createAccess = await assertFamilyCreateAccess(tx, actorUserId);
    if (createAccess) return createAccess;

    const emptyError = canPersistFamily(1, 0);
    if (emptyError) return emptyError;

    const family = await tx.family.create({
      data: {
        organizationId,
        name: input.familyName!,
        address: input.address ?? null,
        note: input.note ?? null,
      },
      select: { id: true },
    });
    familyId = family.id;

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.FAMILY,
      entityId: family.id,
      action: AUDIT_ACTION.FAMILY_UPSERTED,
      newValue: { familyId: family.id, created: true },
    });
  }

  const relations = await loadFamilyRelations(tx, familyId);
  const relationError = canSetAdultRelation(relations, input.relation);
  if (relationError) return relationError;

  try {
    const adult = await tx.familyAdult.create({
      data: {
        familyId,
        relation: input.relation,
        lastName: input.lastName,
        firstName: input.firstName,
        middleName: input.middleName ?? null,
        phones: input.phones,
        email: input.email ?? null,
        userId: input.userId ?? null,
      },
      select: { id: true },
    });

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.FAMILY_ADULT,
      entityId: adult.id,
      action: AUDIT_ACTION.FAMILY_ADULT_CHANGED,
      newValue: { adultId: adult.id, familyId, change: "added", relation: input.relation },
    });

    return { ok: true, data: { familyId, adultId: adult.id } };
  } catch (error) {
    const mapped = mapFamilyPrismaError(error);
    if (mapped) return mapped;
    throw error;
  }
}

export async function addFamilyAdult(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<{ familyId: string; adultId: string }>> {
  const parsed = addFamilyAdultInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    const result = await addFamilyAdultInTransaction(tx, actorUserId, organizationId, parsed.data);
    if (isMutationErr(result)) return result;
    return result;
  });
}
