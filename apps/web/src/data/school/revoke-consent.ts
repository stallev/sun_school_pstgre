import "server-only";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  CONSENT_STATUS,
  MUTATION_ERROR_CODES,
  revokeConsentInputSchema,
  type MutationResult,
  type RevokeConsentInput,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { loadActorOrganizationId, loadPupilInOrganization } from "./school-pupil-shared.server";

type Tx = Prisma.TransactionClient;

export async function revokeConsentInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: RevokeConsentInput,
  revokedAt: Date,
): Promise<MutationResult> {
  const consent = await tx.childDataConsent.findUnique({
    where: { id: input.consentId },
    select: { id: true, pupilId: true, status: true },
  });
  if (!consent) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const pupil = await loadPupilInOrganization(tx, consent.pupilId, organizationId);
  if (isMutationErr(pupil)) return pupil;

  if (
    consent.status !== CONSENT_STATUS.ACTIVE &&
    consent.status !== CONSENT_STATUS.LEGACY_PENDING
  ) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "admin.people.consent_not_revokable",
    };
  }

  await tx.childDataConsent.update({
    where: { id: consent.id },
    data: {
      status: CONSENT_STATUS.REVOKED,
      revokedAt,
    },
  });

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.CHILD_DATA_CONSENT,
    entityId: consent.id,
    action: AUDIT_ACTION.SCHOOL_CONSENT_REVOKED,
    oldValue: { status: consent.status },
    newValue: { status: CONSENT_STATUS.REVOKED, pupilId: consent.pupilId },
    reason: input.reason,
  });

  return { ok: true };
}

export async function revokeConsent(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = revokeConsentInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    return revokeConsentInTransaction(tx, actorUserId, organizationId, parsed.data, new Date());
  });
}
