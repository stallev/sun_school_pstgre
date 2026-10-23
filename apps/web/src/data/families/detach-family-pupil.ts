import "server-only";

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { z } from "zod";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { loadActorOrganizationId, lockPupilRow } from "../school/school-pupil-shared.server";
import { assertFamilyMutateAccess } from "./family-mutate-access.server";

const detachFamilyPupilInputSchema = z.object({ pupilId: z.string().uuid() }).strict();

type Tx = Prisma.TransactionClient;

export async function detachFamilyPupilInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: ReturnType<typeof detachFamilyPupilInputSchema.parse>,
): Promise<MutationResult<{ pupilId: string }>> {
  if (!(await lockPupilRow(tx, input.pupilId))) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const pupil = await tx.pupil.findFirst({
    where: { id: input.pupilId, organizationId },
    select: { id: true, familyId: true },
  });
  if (!pupil?.familyId) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const accessError = await assertFamilyMutateAccess(tx, actorUserId, organizationId, pupil.familyId);
  if (accessError) return accessError;

  const sourceFamilyId = pupil.familyId;
  await tx.pupil.update({
    where: { id: pupil.id },
    data: { familyId: null },
  });

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.PUPIL,
    entityId: pupil.id,
    action: AUDIT_ACTION.FAMILY_PUPIL_TRANSFERRED,
    newValue: { pupilId: pupil.id, targetFamilyId: null, sourceFamilyId },
  });

  return { ok: true, data: { pupilId: pupil.id } };
}

export async function detachFamilyPupil(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<{ pupilId: string }>> {
  const parsed = detachFamilyPupilInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    const result = await detachFamilyPupilInTransaction(tx, actorUserId, organizationId, parsed.data);
    if (isMutationErr(result)) return result;
    return result;
  });
}
