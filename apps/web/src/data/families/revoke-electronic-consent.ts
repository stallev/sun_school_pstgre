import "server-only";

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  CONSENT_CHANNEL,
  CONSENT_STATUS,
  DELETION_REQUEST_TYPE,
  MUTATION_ERROR_CODES,
  computeDueOn,
  lastActiveConsentRevokeBlocked,
  revokeElectronicConsentInputSchema,
  type MutationResult,
  type RevokeElectronicConsentInput,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import {
  deletionAlreadyOpenResult,
  findOpenDeletionRequestForPupil,
  mapDeletionUniqueViolation,
} from "../deletions/deletion-shared.server";
import { calendarDateFromIso } from "../school/calendar-date";
import { lockPupilRow } from "../school/school-pupil-shared.server";
import { loadParentGuardianForPupil } from "./parent-consent-access.server";

type Tx = Prisma.TransactionClient;

export async function revokeElectronicConsentInTransaction(
  tx: Tx,
  actorUserId: string,
  input: RevokeElectronicConsentInput,
  now: Date,
  schoolTimeZone: string,
): Promise<MutationResult<{ requestId?: string }>> {
  const access = await loadParentGuardianForPupil(tx, actorUserId, input.pupilId);
  if (isMutationErr(access)) return access;

  const { guardianAdultId } = access.data;

  const consent = await tx.childDataConsent.findFirst({
    where: {
      pupilId: input.pupilId,
      guardianAdultId,
      channel: CONSENT_CHANNEL.ELECTRONIC,
      status: CONSENT_STATUS.ACTIVE,
      revokedAt: null,
    },
    select: { id: true },
  });
  if (!consent) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const remainingActive = await tx.childDataConsent.count({
    where: {
      pupilId: input.pupilId,
      status: CONSENT_STATUS.ACTIVE,
      revokedAt: null,
      id: { not: consent.id },
    },
  });

  const deletionGate = lastActiveConsentRevokeBlocked(input.confirmDeletion, remainingActive);
  if (deletionGate) return deletionGate;

  if (!(await lockPupilRow(tx, input.pupilId))) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  let requestId: string | undefined;

  if (remainingActive === 0) {
    const existing = await findOpenDeletionRequestForPupil(tx, input.pupilId);
    if (existing) return deletionAlreadyOpenResult();

    const dueOnIso = computeDueOn(now, schoolTimeZone);
    try {
      const created = await tx.deletionRequest.create({
        data: {
          type: DELETION_REQUEST_TYPE.CHILD_DATA,
          subjectPupilId: input.pupilId,
          requestedById: actorUserId,
          requestedAt: now,
          reason: null,
          dueOn: calendarDateFromIso(dueOnIso),
        },
        select: { id: true },
      });
      requestId = created.id;

      await writeAudit(tx, {
        actorUserId,
        source: AUDIT_SOURCE.USER,
        entityType: AUDIT_ENTITY_TYPE.DELETION_REQUEST,
        entityId: created.id,
        action: AUDIT_ACTION.DELETION_REQUESTED,
        newValue: { type: DELETION_REQUEST_TYPE.CHILD_DATA, subjectPupilId: input.pupilId },
      });
    } catch (error) {
      const mapped = mapDeletionUniqueViolation(error);
      if (mapped) return mapped;
      throw error;
    }
  }

  await tx.childDataConsent.update({
    where: { id: consent.id },
    data: {
      status: CONSENT_STATUS.REVOKED,
      revokedAt: now,
    },
  });

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.CHILD_DATA_CONSENT,
    entityId: consent.id,
    action: AUDIT_ACTION.CONSENT_REVOKED,
    newValue: { pupilId: input.pupilId, consentId: consent.id },
  });

  return requestId ? { ok: true, data: { requestId } } : { ok: true, data: {} };
}

export async function revokeElectronicConsent(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
  now: Date,
  schoolTimeZone: string,
): Promise<MutationResult<{ requestId?: string }>> {
  const parsed = revokeElectronicConsentInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction((tx) =>
    revokeElectronicConsentInTransaction(tx, actorUserId, parsed.data, now, schoolTimeZone),
  );
}
