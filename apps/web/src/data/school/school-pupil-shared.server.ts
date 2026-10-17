import "server-only";
import {
  CONSENT_STATUS,
  MUTATION_ERROR_CODES,
  type ConsentStatus,
  type MutationErr,
} from "@sunschool/domain";
import type { Prisma } from "@sunschool/db";
import { hasEnrollableConsentStatus } from "./pupil-consent-view.server";

type Tx = Prisma.TransactionClient;

export async function loadActorOrganizationId(tx: Tx, actorUserId: string): Promise<string | null> {
  const user = await tx.appUser.findUnique({
    where: { id: actorUserId },
    select: { organizationId: true },
  });
  return user?.organizationId ?? null;
}

export async function loadPupilInOrganization(
  tx: Tx,
  pupilId: string,
  organizationId: string,
): Promise<{ id: string; isActive: boolean } | MutationErr> {
  const pupil = await tx.pupil.findFirst({
    where: { id: pupilId, organizationId },
    select: { id: true, isActive: true },
  });
  if (!pupil) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  return pupil;
}

export async function lockPupilRow(tx: Tx, pupilId: string): Promise<boolean> {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM pupil WHERE id = ${pupilId}::uuid FOR UPDATE
  `;
  return rows.length > 0;
}

export const isoTodayUtc = (): string => new Date().toISOString().slice(0, 10);

export const validateBirthDateInPast = (birthDate: string, todayIso: string): MutationErr | null => {
  if (birthDate >= todayIso) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "admin.people.birth_date_in_future",
      fields: { birthDate: "admin.people.birth_date_in_future" },
    };
  }
  return null;
};

export const validateSignedOnNotInFuture = (signedOn: string, todayIso: string): MutationErr | null => {
  if (signedOn > todayIso) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.VALIDATION,
      message: "admin.people.consent_date_in_future",
      fields: { signedOn: "admin.people.consent_date_in_future" },
    };
  }
  return null;
};

export async function resolvePupilConsentStatus(
  tx: Tx,
  pupilId: string,
  todayIso: string,
): Promise<ConsentStatus | null> {
  const legacyRow = await tx.appSetting.findUnique({
    where: { key: "legacy_consent_deadline_on" },
    select: { value: true },
  });
  const legacyDeadlineOn =
    legacyRow?.value && typeof legacyRow.value === "string" ? legacyRow.value : null;

  const consents = await tx.childDataConsent.findMany({
    where: { pupilId },
    select: { status: true },
  });

  if (consents.some((row) => row.status === CONSENT_STATUS.ACTIVE)) {
    return CONSENT_STATUS.ACTIVE;
  }
  if (
    consents.some((row) => row.status === CONSENT_STATUS.LEGACY_PENDING) &&
    hasEnrollableConsentStatus(CONSENT_STATUS.LEGACY_PENDING, todayIso, legacyDeadlineOn)
  ) {
    return CONSENT_STATUS.LEGACY_PENDING;
  }
  return null;
}
