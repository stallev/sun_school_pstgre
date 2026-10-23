import "server-only";

import { MUTATION_ERROR_CODES, type MutationResult } from "@sunschool/domain";
import type { Prisma, PrismaClient } from "@sunschool/db";
import { loadActorOrganizationId } from "../school/school-pupil-shared.server";
import { assertFamilyMutateAccess } from "./family-mutate-access.server";

type Tx = Prisma.TransactionClient;

export type FamilyAdminPageRow = {
  familyId: string;
  name: string;
  address: string | null;
  note: string | null;
};

/** AZ-58 — admin family screen reads address and note (contacts use listFamilyContacts). */
export async function loadFamilyForAdminPageInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  familyId: string,
): Promise<MutationResult<FamilyAdminPageRow>> {
  const accessError = await assertFamilyMutateAccess(tx, actorUserId, organizationId, familyId);
  if (accessError) return accessError;

  const family = await tx.family.findFirst({
    where: { id: familyId, organizationId },
    select: { id: true, name: true, address: true, note: true },
  });
  if (!family) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  return {
    ok: true,
    data: {
      familyId: family.id,
      name: family.name,
      address: family.address,
      note: family.note,
    },
  };
}

export async function loadFamilyForAdminPage(
  db: PrismaClient,
  actorUserId: string,
  familyId: string,
): Promise<MutationResult<FamilyAdminPageRow>> {
  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    return loadFamilyForAdminPageInTransaction(tx, actorUserId, organizationId, familyId);
  });
}
