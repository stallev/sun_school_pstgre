import "server-only";

import {
  CONSENT_CHANNEL,
  CONSENT_STATUS,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { getDefaultOrganizationId } from "../access/get-organization-id.server";
import { isoFromCalendarDate } from "../school/calendar-date";
import { loadOpenChildDeletionForFamily } from "./load-open-child-deletion-for-family.server";
import {
  assertParentPupilAccess,
  loadParentChildOptions,
  resolveParentSelectedPupilId,
  type ParentChildOption,
} from "./parent-child-access.server";
import { readFeaturesParentsEnabled } from "./family-feature.server";

export type ParentChildDataPageData =
  | { kind: "flag_off" }
  | { kind: "not_found" }
  | {
      kind: "page";
      children: ParentChildOption[];
      pupilId: string;
      familyName: string;
      familyAddress: string | null;
      phones: string[];
      email: string | null;
      consentActive: boolean;
      consentSignedOn: string | null;
      consentTextVersion: string | null;
      openDeletion: Awaited<ReturnType<typeof loadOpenChildDeletionForFamily>>;
    };

export async function loadParentChildDataPage(
  db: PrismaClient,
  actorUserId: string,
  preferredPupilId: string | null,
): Promise<ParentChildDataPageData> {
  const flagOn = await db.$transaction((tx) => readFeaturesParentsEnabled(tx));
  if (!flagOn) return { kind: "flag_off" };

  const organizationId = await getDefaultOrganizationId(db);
  const children = await db.$transaction((tx) =>
    loadParentChildOptions(tx, actorUserId, organizationId),
  );
  if (children.length === 0) return { kind: "not_found" };

  const pupilId = resolveParentSelectedPupilId(children, preferredPupilId, children[0]!.pupilId);
  if (!pupilId) return { kind: "not_found" };

  const access = await db.$transaction((tx) => assertParentPupilAccess(tx, actorUserId, pupilId));
  if (isMutationErr(access)) return { kind: "not_found" };

  const pupil = await db.pupil.findFirst({
    where: { id: pupilId, organizationId },
    select: { familyId: true },
  });
  if (!pupil?.familyId) return { kind: "not_found" };

  const adult = await db.familyAdult.findFirst({
    where: { userId: actorUserId, familyId: pupil.familyId },
    select: { phones: true, email: true },
  });
  if (!adult) return { kind: "not_found" };

  const family = await db.family.findUnique({
    where: { id: pupil.familyId },
    select: { name: true, address: true },
  });
  if (!family) return { kind: "not_found" };

  const consent = await db.childDataConsent.findFirst({
    where: {
      pupilId,
      guardianAdultId: access.data.guardianAdultId,
      channel: CONSENT_CHANNEL.ELECTRONIC,
      status: CONSENT_STATUS.ACTIVE,
      revokedAt: null,
    },
    select: { signedOn: true, textVersion: true },
  });

  const openDeletion = await loadOpenChildDeletionForFamily(db, actorUserId, pupilId);

  return {
    kind: "page",
    children,
    pupilId,
    familyName: family.name,
    familyAddress: family.address,
    phones: Array.isArray(adult.phones) ? (adult.phones as string[]) : [],
    email: adult.email,
    consentActive: Boolean(consent),
    consentSignedOn: consent?.signedOn ? isoFromCalendarDate(consent.signedOn) : null,
    consentTextVersion: consent?.textVersion ?? null,
    openDeletion,
  };
}
