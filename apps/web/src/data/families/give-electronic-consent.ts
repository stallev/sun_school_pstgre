import "server-only";

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  CONSENT_CHANNEL,
  CONSENT_STATUS,
  MUTATION_ERROR_CODES,
  giveElectronicConsentInputSchema,
  type GiveElectronicConsentInput,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { readChildConsentTextVersion } from "../school/child-consent-text-version.server";
import { calendarDateFromIso } from "../school/calendar-date";
import { isoTodayUtc } from "../school/school-pupil-shared.server";
import { loadParentGuardianForPupil } from "./parent-consent-access.server";

type Tx = Prisma.TransactionClient;

export async function giveElectronicConsentInTransaction(
  tx: Tx,
  actorUserId: string,
  input: GiveElectronicConsentInput,
  todayIso: string,
): Promise<MutationResult<{ consentId: string }>> {
  const access = await loadParentGuardianForPupil(tx, actorUserId, input.pupilId);
  if (isMutationErr(access)) return access;

  const { guardianAdultId } = access.data;
  const textVersion = await readChildConsentTextVersion(tx);

  const existing = await tx.childDataConsent.findFirst({
    where: {
      pupilId: input.pupilId,
      guardianAdultId,
      channel: CONSENT_CHANNEL.ELECTRONIC,
      status: CONSENT_STATUS.ACTIVE,
      revokedAt: null,
    },
    select: { id: true },
  });
  if (existing) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.CONFLICT,
      message: "parent.consent.already_given",
    };
  }

  const created = await tx.childDataConsent.create({
    data: {
      pupilId: input.pupilId,
      guardianAdultId,
      channel: CONSENT_CHANNEL.ELECTRONIC,
      textVersion,
      signedOn: calendarDateFromIso(todayIso),
      markedById: actorUserId,
      status: CONSENT_STATUS.ACTIVE,
    },
    select: { id: true },
  });

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.CHILD_DATA_CONSENT,
    entityId: created.id,
    action: AUDIT_ACTION.CONSENT_GIVEN,
    newValue: { pupilId: input.pupilId, consentId: created.id },
  });

  return { ok: true, data: { consentId: created.id } };
}

export async function giveElectronicConsent(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<{ consentId: string }>> {
  const parsed = giveElectronicConsentInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const todayIso = isoTodayUtc();

  return db.$transaction((tx) =>
    giveElectronicConsentInTransaction(tx, actorUserId, parsed.data, todayIso),
  );
}
