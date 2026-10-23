import "server-only";

import {
  mapAdultToTeacherFamilyContact,
  MUTATION_ERROR_CODES,
  type MutationResult,
  type TeacherFamilyAdultContact,
} from "@sunschool/domain";
import type { Prisma, PrismaClient } from "@sunschool/db";
import { loadActorOrganizationId } from "../school/school-pupil-shared.server";
import { assertFamilyContactsAccess } from "./family-contacts-access.server";

type Tx = Prisma.TransactionClient;

export type ListFamilyContactsResult = {
  adults: TeacherFamilyAdultContact[];
};

export async function listFamilyContactsInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  pupilId: string,
): Promise<MutationResult<ListFamilyContactsResult>> {
  const accessError = await assertFamilyContactsAccess(tx, actorUserId, organizationId, pupilId);
  if (accessError) return accessError;

  const pupil = await tx.pupil.findFirst({
    where: { id: pupilId, organizationId },
    select: { familyId: true },
  });
  if (!pupil?.familyId) {
    return { ok: true, data: { adults: [] } };
  }

  const adults = await tx.familyAdult.findMany({
    where: { familyId: pupil.familyId },
    orderBy: [{ relation: "asc" }, { lastName: "asc" }],
    select: {
      id: true,
      lastName: true,
      firstName: true,
      middleName: true,
      relation: true,
      phones: true,
      email: true,
    },
  });

  return {
    ok: true,
    data: { adults: adults.map(mapAdultToTeacherFamilyContact) },
  };
}

export async function listFamilyContacts(
  db: PrismaClient,
  actorUserId: string,
  pupilId: string,
): Promise<MutationResult<ListFamilyContactsResult>> {
  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    return listFamilyContactsInTransaction(tx, actorUserId, organizationId, pupilId);
  });
}
