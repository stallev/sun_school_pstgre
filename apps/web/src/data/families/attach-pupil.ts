import "server-only";

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  canAttachPupil,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { loadActorOrganizationId, lockPupilRow } from "../school/school-pupil-shared.server";
import { assertFamilyMutateAccess } from "./family-mutate-access.server";
import { attachFamilyPupilInputSchema } from "./family-schemas";

type Tx = Prisma.TransactionClient;

export async function attachPupilInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: ReturnType<typeof attachFamilyPupilInputSchema.parse>,
): Promise<MutationResult<{ pupilId: string }>> {
  const accessError = await assertFamilyMutateAccess(tx, actorUserId, organizationId, input.familyId);
  if (accessError) return accessError;

  if (!(await lockPupilRow(tx, input.pupilId))) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const pupil = await tx.pupil.findFirst({
    where: { id: input.pupilId, organizationId },
    select: { id: true, familyId: true },
  });
  if (!pupil) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const attachError = canAttachPupil(pupil.familyId);
  if (attachError) return attachError;

  await tx.pupil.update({
    where: { id: pupil.id },
    data: { familyId: input.familyId },
  });

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.PUPIL,
    entityId: pupil.id,
    action: AUDIT_ACTION.FAMILY_PUPIL_TRANSFERRED,
    newValue: { pupilId: pupil.id, targetFamilyId: input.familyId, sourceFamilyId: null },
  });

  return { ok: true, data: { pupilId: pupil.id } };
}

export async function attachPupil(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<{ pupilId: string }>> {
  const parsed = attachFamilyPupilInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    const result = await attachPupilInTransaction(tx, actorUserId, organizationId, parsed.data);
    if (isMutationErr(result)) return result;
    return result;
  });
}
