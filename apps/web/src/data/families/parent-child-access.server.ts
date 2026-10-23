import "server-only";

import {
  ACADEMIC_YEAR_STATUS,
  CONSENT_CHANNEL,
  CONSENT_STATUS,
  MUTATION_ERROR_CODES,
  type MutationResult,
} from "@sunschool/domain";
import type { Prisma } from "@sunschool/db";
import { formatDisplayName } from "@/lib/person/format-display-name";
import { isMutationErr } from "../access/access-admin-guards.server";
import { loadActorOrganizationId } from "../school/school-pupil-shared.server";
import { assertParentsFeatureOn } from "./family-mutate-access.server";
import { loadParentGuardianForPupil } from "./parent-consent-access.server";

type Tx = Prisma.TransactionClient;

export type ParentChildOption = {
  pupilId: string;
  displayName: string;
  gradeName: string | null;
  hasElectronicConsent: boolean;
};

export async function loadParentChildOptions(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
): Promise<ParentChildOption[]> {
  const adults = await tx.familyAdult.findMany({
    where: { userId: actorUserId },
    select: { id: true, familyId: true },
  });
  if (adults.length === 0) return [];

  const pupils = await tx.pupil.findMany({
    where: {
      organizationId,
      familyId: { in: adults.map((row) => row.familyId) },
    },
    select: {
      id: true,
      lastName: true,
      firstName: true,
      middleName: true,
      enrollments: {
        where: { academicYear: { status: ACADEMIC_YEAR_STATUS.ACTIVE } },
        take: 1,
        select: { grade: { select: { name: true } } },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const guardianIds = new Set(adults.map((row) => row.id));
  const consents = await tx.childDataConsent.findMany({
    where: {
      pupilId: { in: pupils.map((row) => row.id) },
      guardianAdultId: { in: [...guardianIds] },
      channel: CONSENT_CHANNEL.ELECTRONIC,
      status: CONSENT_STATUS.ACTIVE,
      revokedAt: null,
    },
    select: { pupilId: true, guardianAdultId: true },
  });
  const consentedPupilIds = new Set(consents.map((row) => row.pupilId));

  return pupils.map((pupil) => ({
    pupilId: pupil.id,
    displayName: formatDisplayName(pupil),
    gradeName: pupil.enrollments[0]?.grade.name ?? null,
    hasElectronicConsent: consentedPupilIds.has(pupil.id),
  }));
}

export async function assertParentPupilAccess(
  tx: Tx,
  actorUserId: string,
  pupilId: string,
): Promise<MutationResult<{ organizationId: string; guardianAdultId: string }>> {
  const flagError = await assertParentsFeatureOn(tx);
  if (flagError) return flagError;
  return loadParentGuardianForPupil(tx, actorUserId, pupilId);
}

export async function assertParentCanViewChildData(
  tx: Tx,
  actorUserId: string,
  pupilId: string,
): Promise<MutationResult<{ organizationId: string; guardianAdultId: string }>> {
  const access = await assertParentPupilAccess(tx, actorUserId, pupilId);
  if (isMutationErr(access)) return access;

  const consent = await tx.childDataConsent.findFirst({
    where: {
      pupilId,
      guardianAdultId: access.data.guardianAdultId,
      channel: CONSENT_CHANNEL.ELECTRONIC,
      status: CONSENT_STATUS.ACTIVE,
      revokedAt: null,
    },
    select: { id: true },
  });
  if (!consent) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  return access;
}

/** Explicit `pupilId` query must match a linked child; omit param to use fallback. */
export function resolveParentSelectedPupilId(
  children: readonly { pupilId: string }[],
  preferredPupilId: string | null,
  fallbackPupilId: string,
): string | null {
  if (!preferredPupilId) return fallbackPupilId;
  return children.some((row) => row.pupilId === preferredPupilId) ? preferredPupilId : null;
}

export async function loadParentOrganizationId(
  tx: Tx,
  actorUserId: string,
): Promise<MutationResult<string>> {
  const flagError = await assertParentsFeatureOn(tx);
  if (flagError) return flagError;
  const organizationId = await loadActorOrganizationId(tx, actorUserId);
  if (!organizationId) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  return { ok: true, data: organizationId };
}
