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
import { loadActorOrganizationId } from "../school/school-pupil-shared.server";
import { assertFamilyMutateAccess } from "./family-mutate-access.server";
import { upsertFamilyInputSchema } from "./family-schemas";

type Tx = Prisma.TransactionClient;

export async function upsertFamilyInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: ReturnType<typeof upsertFamilyInputSchema.parse>,
): Promise<MutationResult<{ familyId: string }>> {
  const accessError = await assertFamilyMutateAccess(tx, actorUserId, organizationId, input.familyId);
  if (accessError) return accessError;

  const existing = await tx.family.findFirst({
    where: { id: input.familyId, organizationId },
    select: { id: true, name: true, address: true, note: true },
  });
  if (!existing) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const hasAddress = Boolean(input.address);
  const hasNote = Boolean(input.note);

  await tx.family.update({
    where: { id: existing.id },
    data: {
      name: input.name,
      address: input.address ?? null,
      note: input.note ?? null,
    },
  });

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.FAMILY,
    entityId: existing.id,
    action: AUDIT_ACTION.FAMILY_UPSERTED,
    newValue: { familyId: existing.id, hasAddress, hasNote },
  });

  return { ok: true, data: { familyId: existing.id } };
}

export async function upsertFamily(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<{ familyId: string }>> {
  const parsed = upsertFamilyInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    const result = await upsertFamilyInTransaction(tx, actorUserId, organizationId, parsed.data);
    if (isMutationErr(result)) return result;
    return result;
  });
}
