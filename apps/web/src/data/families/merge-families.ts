import "server-only";

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  canMergeFamilies,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { loadActorOrganizationId } from "../school/school-pupil-shared.server";
import { assertFamilyMutateAccess } from "./family-mutate-access.server";
import { mapFamilyPrismaError } from "./family-prisma-errors";
import { mergeFamiliesInputSchema } from "./family-schemas";

type Tx = Prisma.TransactionClient;

export async function mergeFamiliesInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: ReturnType<typeof mergeFamiliesInputSchema.parse>,
): Promise<MutationResult<{ targetFamilyId: string }>> {
  for (const familyId of [input.sourceFamilyId, input.targetFamilyId]) {
    const accessError = await assertFamilyMutateAccess(tx, actorUserId, organizationId, familyId);
    if (accessError) return accessError;
  }

  const [source, target] = await Promise.all([
    tx.family.findFirst({
      where: { id: input.sourceFamilyId, organizationId },
      select: { id: true },
    }),
    tx.family.findFirst({
      where: { id: input.targetFamilyId, organizationId },
      select: { id: true },
    }),
  ]);
  if (!source || !target) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const [sourceRelations, targetRelations] = await Promise.all([
    tx.familyAdult.findMany({
      where: { familyId: input.sourceFamilyId },
      select: { relation: true },
    }),
    tx.familyAdult.findMany({
      where: { familyId: input.targetFamilyId },
      select: { relation: true },
    }),
  ]);

  const mergeError = canMergeFamilies(
    targetRelations.map((row) => row.relation),
    sourceRelations.map((row) => row.relation),
  );
  if (mergeError) return mergeError;

  try {
    await tx.pupil.updateMany({
      where: { familyId: input.sourceFamilyId },
      data: { familyId: input.targetFamilyId },
    });

    await tx.familyAdult.updateMany({
      where: { familyId: input.sourceFamilyId },
      data: { familyId: input.targetFamilyId },
    });

    await tx.family.delete({ where: { id: input.sourceFamilyId } });

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.FAMILY,
      entityId: input.targetFamilyId,
      action: AUDIT_ACTION.FAMILY_MERGED,
      newValue: {
        targetFamilyId: input.targetFamilyId,
        sourceFamilyId: input.sourceFamilyId,
      },
    });

    return { ok: true, data: { targetFamilyId: input.targetFamilyId } };
  } catch (error) {
    const mapped = mapFamilyPrismaError(error);
    if (mapped) return mapped;
    throw error;
  }
}

export async function mergeFamilies(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<{ targetFamilyId: string }>> {
  const parsed = mergeFamiliesInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    const result = await mergeFamiliesInTransaction(tx, actorUserId, organizationId, parsed.data);
    if (isMutationErr(result)) return result;
    return result;
  });
}
