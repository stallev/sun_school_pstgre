import "server-only";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  CONSENT_CHANNEL,
  CONSENT_STATUS,
  MUTATION_ERROR_CODES,
  recordPaperConsentInputSchema,
  type MutationResult,
  type RecordPaperConsentInput,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { readChildConsentTextVersion } from "./child-consent-text-version.server";
import { calendarDateFromIso } from "./calendar-date";
import { assertAdminActor } from "./school-enrollment-shared.server";
import {
  isoTodayUtc,
  loadActorOrganizationId,
  loadPupilInOrganization,
  lockPupilRow,
  validateSignedOnNotInFuture,
} from "./school-pupil-shared.server";

type Tx = Prisma.TransactionClient;

export async function recordPaperConsentInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: RecordPaperConsentInput,
  todayIso: string,
): Promise<MutationResult<{ consentId: string }>> {
  const adminError = await assertAdminActor(tx, actorUserId);
  if (adminError) return adminError;

  const signedOnError = validateSignedOnNotInFuture(input.signedOn, todayIso);
  if (signedOnError) return signedOnError;

  const canonicalVersion = await readChildConsentTextVersion(tx);
  if (input.textVersion !== canonicalVersion && input.textVersion !== "legacy") {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "admin.people.consent_version_invalid",
      fields: { textVersion: "admin.people.consent_version_invalid" },
    };
  }

  const locked = await lockPupilRow(tx, input.pupilId);
  if (!locked) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const pupil = await loadPupilInOrganization(tx, input.pupilId, organizationId);
  if (isMutationErr(pupil)) return pupil;

  const legacyPending = await tx.childDataConsent.findFirst({
    where: { pupilId: input.pupilId, status: CONSENT_STATUS.LEGACY_PENDING },
    select: { id: true },
  });

  let consentId: string;

  if (legacyPending) {
    const updated = await tx.childDataConsent.update({
      where: { id: legacyPending.id },
      data: {
        status: CONSENT_STATUS.ACTIVE,
        channel: CONSENT_CHANNEL.PAPER,
        signerName: input.signerName,
        signedOn: calendarDateFromIso(input.signedOn),
        textVersion: input.textVersion,
        paperStorageNote: input.storageNote ?? null,
        markedById: actorUserId,
      },
      select: { id: true },
    });
    consentId = updated.id;
  } else {
    const existingActive = await tx.childDataConsent.findFirst({
      where: { pupilId: input.pupilId, status: CONSENT_STATUS.ACTIVE },
      select: { id: true },
    });
    if (existingActive) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.CONFLICT,
        message: "admin.people.consent_already_active",
      };
    }

    const created = await tx.childDataConsent.create({
      data: {
        pupilId: input.pupilId,
        channel: CONSENT_CHANNEL.PAPER,
        signerName: input.signerName,
        signedOn: calendarDateFromIso(input.signedOn),
        textVersion: input.textVersion,
        paperStorageNote: input.storageNote ?? null,
        markedById: actorUserId,
        status: CONSENT_STATUS.ACTIVE,
      },
      select: { id: true },
    });
    consentId = created.id;
  }

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.CHILD_DATA_CONSENT,
    entityId: consentId,
    action: AUDIT_ACTION.SCHOOL_CONSENT_RECORDED,
    newValue: { pupilId: input.pupilId, consentId },
  });

  return { ok: true, data: { consentId } };
}

export async function recordPaperConsent(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<{ consentId: string }>> {
  const parsed = recordPaperConsentInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const todayIso = isoTodayUtc();

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    return recordPaperConsentInTransaction(tx, actorUserId, organizationId, parsed.data, todayIso);
  });
}
