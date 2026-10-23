import "server-only";

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { loadActorOrganizationId, lockPupilRow } from "../school/school-pupil-shared.server";
import { assertFamilyMutateAccess } from "./family-mutate-access.server";
import { transferFamilyPupilInputSchema } from "./family-schemas";

type Tx = Prisma.TransactionClient;

export async function transferPupilInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: ReturnType<typeof transferFamilyPupilInputSchema.parse>,
): Promise<MutationResult<{ pupilId: string }>> {
  const accessError = await assertFamilyMutateAccess(
    tx,
    actorUserId,
    organizationId,
    input.targetFamilyId,
  );
  if (accessError) return accessError;

  if (!(await lockPupilRow(tx, input.pupilId))) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const pupil = await tx.pupil.findFirst({
    where: { id: input.pupilId, organizationId },
    select: { id: true, familyId: true },
  });
  if (!pupil || !pupil.familyId) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  if (pupil.familyId === input.targetFamilyId) {
    return { ok: true, data: { pupilId: pupil.id } };
  }

  const sourceAccess = await assertFamilyMutateAccess(
    tx,
    actorUserId,
    organizationId,
    pupil.familyId,
  );
  if (sourceAccess) return sourceAccess;

  const sourceFamilyId = pupil.familyId;

  await tx.pupil.update({
    where: { id: pupil.id },
    data: { familyId: input.targetFamilyId },
  });

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.PUPIL,
    entityId: pupil.id,
    action: AUDIT_ACTION.FAMILY_PUPIL_TRANSFERRED,
    newValue: {
      pupilId: pupil.id,
      sourceFamilyId,
      targetFamilyId: input.targetFamilyId,
    },
  });

  return { ok: true, data: { pupilId: pupil.id } };
}

export async function transferPupil(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<{ pupilId: string }>> {
  const parsed = transferFamilyPupilInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    const result = await transferPupilInTransaction(tx, actorUserId, organizationId, parsed.data);
    if (isMutationErr(result)) return result;
    return result;
  });
}
