import "server-only";

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  updateOwnAdultContactsInputSchema,
  type MutationResult,
  type UpdateOwnAdultContactsInput,
} from "@sunschool/domain";
import { writeAudit, type PrismaClient } from "@sunschool/db";
import { mutationFromZodError } from "../access/map-zod-fields";
import { loadActorOrganizationId } from "../school/school-pupil-shared.server";
import { assertParentsFeatureOn } from "./family-mutate-access.server";

export async function updateOwnAdultContacts(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<{ adultId: string }>> {
  const parsed = updateOwnAdultContactsInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const flagError = await assertParentsFeatureOn(tx);
    if (flagError) return flagError;

    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const adult = await tx.familyAdult.findFirst({
      where: { userId: actorUserId },
      select: { id: true, family: { select: { organizationId: true } } },
    });
    if (!adult || adult.family.organizationId !== organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    await tx.familyAdult.update({
      where: { id: adult.id },
      data: { phones: parsed.data.phones, email: parsed.data.email ?? null },
    });

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.FAMILY_ADULT,
      entityId: adult.id,
      action: AUDIT_ACTION.FAMILY_ADULT_CHANGED,
      newValue: { adultId: adult.id, change: "contacts_updated" },
    });

    return { ok: true, data: { adultId: adult.id } };
  });
}

export type { UpdateOwnAdultContactsInput };
