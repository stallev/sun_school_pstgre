import "server-only";

import {
  ACADEMIC_YEAR_STATUS,
  CONSENT_STATUS,
  MUTATION_ERROR_CODES,
  type AccountStatus,
  type AdultRelation,
  type MutationResult,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { getDefaultOrganizationId } from "@/data/access/get-organization-id.server";
import { formatAppUserDisplayName, formatDisplayName } from "@/lib/person/format-display-name";
import { loadActorOrganizationId } from "../school/school-pupil-shared.server";
import { assertFamilyCreateAccess, assertFamilyMutateAccess } from "./family-mutate-access.server";
import { readFeaturesParentsEnabled } from "./family-feature.server";

export type FamilyListAdultPreview = {
  displayName: string;
  relation: AdultRelation;
  hasAccount: boolean;
};

export type FamilyListChildPreview = {
  displayName: string;
  groupName: string | null;
  lacksConsent: boolean;
};

export type FamilyListRow = {
  familyId: string;
  name: string;
  adults: FamilyListAdultPreview[];
  children: FamilyListChildPreview[];
};

export type FamilyAdultDetail = {
  adultId: string;
  displayName: string;
  lastName: string;
  firstName: string;
  middleName: string | null;
  relation: AdultRelation;
  phones: string[];
  email: string | null;
  userId: string | null;
  userDisplayName: string | null;
  accountStatus: AccountStatus | null;
};

export type FamilyChildConsent = {
  hasActiveConsent: boolean;
  channel: string | null;
  grantedByLabel: string | null;
};

export type FamilyChildDetail = {
  pupilId: string;
  displayName: string;
  groupName: string | null;
  consent: FamilyChildConsent;
};

export type FamilyAdminDetail = {
  familyId: string;
  name: string;
  address: string | null;
  note: string | null;
  createdAtIso: string;
  adults: FamilyAdultDetail[];
  children: FamilyChildDetail[];
};

export type AttachPupilOption = {
  pupilId: string;
  displayName: string;
  groupName: string | null;
};

async function loadActiveYearId(db: PrismaClient, organizationId: string): Promise<string | null> {
  const year = await db.academicYear.findFirst({
    where: {
      organizationId,
      status: { in: [ACADEMIC_YEAR_STATUS.ACTIVE, ACADEMIC_YEAR_STATUS.DRAFT] },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: { id: true },
  });
  return year?.id ?? null;
}

function mapChildConsent(
  consents: {
    status: string;
    channel: string;
    guardianAdult: {
      lastName: string;
      firstName: string;
      middleName: string | null;
      relation: AdultRelation;
    } | null;
  }[],
): FamilyChildConsent {
  const active = consents.find((row) => row.status === CONSENT_STATUS.ACTIVE);
  if (!active) {
    return { hasActiveConsent: false, channel: null, grantedByLabel: null };
  }
  const guardian = active.guardianAdult;
  const grantedByLabel = guardian
    ? `${formatDisplayName(guardian)} (${guardian.relation})`
    : null;
  return {
    hasActiveConsent: true,
    channel: active.channel,
    grantedByLabel,
  };
}

export async function loadFamiliesAdminList(
  db: PrismaClient,
  actorUserId: string,
): Promise<MutationResult<{ families: FamilyListRow[]; unassignedPupilCount: number }>> {
  const flagOn = await db.$transaction((tx) => readFeaturesParentsEnabled(tx));
  if (!flagOn) {
    return { ok: false, code: MUTATION_ERROR_CODES.FAMILY_FLAG_OFF, message: "parent.flag_off" };
  }

  const access = await db.$transaction((tx) => assertFamilyCreateAccess(tx, actorUserId));
  if (access) return access;

  const organizationId = await getDefaultOrganizationId(db);
  const yearId = await loadActiveYearId(db, organizationId);

  const families = await db.family.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      adults: {
        select: {
          relation: true,
          lastName: true,
          firstName: true,
          middleName: true,
          userId: true,
        },
      },
      pupils: {
        select: {
          lastName: true,
          firstName: true,
          middleName: true,
          consents: { where: { status: CONSENT_STATUS.ACTIVE }, select: { id: true }, take: 1 },
          enrollments: {
            ...(yearId
              ? { where: { academicYearId: yearId, endsOn: null }, take: 1 }
              : { take: 0 }),
            select: { grade: { select: { name: true } } },
          },
        },
      },
    },
  });

  const unassignedPupilCount = await db.pupil.count({
    where: { organizationId, familyId: null, isActive: true },
  });

  const rows: FamilyListRow[] = families.map((family) => ({
    familyId: family.id,
    name: family.name,
    adults: family.adults.map((adult) => ({
      displayName: formatDisplayName(adult),
      relation: adult.relation as AdultRelation,
      hasAccount: Boolean(adult.userId),
    })),
    children: family.pupils.map((pupil) => ({
      displayName: formatDisplayName(pupil),
      groupName: pupil.enrollments[0]?.grade.name ?? null,
      lacksConsent: pupil.consents.length === 0,
    })),
  }));

  return { ok: true, data: { families: rows, unassignedPupilCount } };
}

export async function loadFamilyAdminDetail(
  db: PrismaClient,
  actorUserId: string,
  familyId: string,
  deletedUserTemplate: string,
): Promise<MutationResult<FamilyAdminDetail>> {
  const organizationId = await db.$transaction((tx) => loadActorOrganizationId(tx, actorUserId));
  if (!organizationId) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const flagOn = await db.$transaction((tx) => readFeaturesParentsEnabled(tx));
  if (!flagOn) {
    return { ok: false, code: MUTATION_ERROR_CODES.FAMILY_FLAG_OFF, message: "parent.flag_off" };
  }

  const access = await db.$transaction((tx) =>
    assertFamilyMutateAccess(tx, actorUserId, organizationId, familyId),
  );
  if (access) return access;

  const yearId = await loadActiveYearId(db, organizationId);

  const family = await db.family.findFirst({
    where: { id: familyId, organizationId },
    select: {
      id: true,
      name: true,
      address: true,
      note: true,
      createdAt: true,
      adults: {
        orderBy: [{ relation: "asc" }, { lastName: "asc" }],
        select: {
          id: true,
          relation: true,
          lastName: true,
          firstName: true,
          middleName: true,
          phones: true,
          email: true,
          userId: true,
          user: {
            select: {
              status: true,
              deletedOrdinal: true,
              lastName: true,
              firstName: true,
              middleName: true,
            },
          },
        },
      },
      pupils: {
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        select: {
          id: true,
          lastName: true,
          firstName: true,
          middleName: true,
          consents: {
            where: { status: CONSENT_STATUS.ACTIVE },
            select: {
              status: true,
              channel: true,
              guardianAdult: {
                select: {
                  relation: true,
                  lastName: true,
                  firstName: true,
                  middleName: true,
                },
              },
            },
          },
          enrollments: {
            ...(yearId
              ? { where: { academicYearId: yearId, endsOn: null }, take: 1 }
              : { take: 0 }),
            select: { grade: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!family) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  return {
    ok: true,
    data: {
      familyId: family.id,
      name: family.name,
      address: family.address,
      note: family.note,
      createdAtIso: family.createdAt.toISOString(),
      adults: family.adults.map((adult) => ({
        adultId: adult.id,
        displayName: formatDisplayName(adult),
        lastName: adult.lastName,
        firstName: adult.firstName,
        middleName: adult.middleName,
        relation: adult.relation as AdultRelation,
        phones: Array.isArray(adult.phones)
          ? adult.phones.filter((phone): phone is string => typeof phone === "string")
          : [],
        email: adult.email,
        userId: adult.userId,
        userDisplayName: adult.user
          ? formatAppUserDisplayName(
              {
                status: adult.user.status,
                deletedOrdinal: adult.user.deletedOrdinal,
                lastName: adult.user.lastName,
                firstName: adult.user.firstName,
                middleName: adult.user.middleName,
              },
              deletedUserTemplate,
            )
          : null,
        accountStatus: adult.user?.status ?? null,
      })),
      children: family.pupils.map((pupil) => ({
        pupilId: pupil.id,
        displayName: formatDisplayName(pupil),
        groupName: pupil.enrollments[0]?.grade.name ?? null,
        consent: mapChildConsent(pupil.consents),
      })),
    },
  };
}

export async function loadPupilsForFamilyAttach(
  db: PrismaClient,
  actorUserId: string,
): Promise<MutationResult<AttachPupilOption[]>> {
  const organizationId = await db.$transaction((tx) => loadActorOrganizationId(tx, actorUserId));
  if (!organizationId) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const access = await db.$transaction((tx) => assertFamilyCreateAccess(tx, actorUserId));
  if (access) return access;

  const yearId = await loadActiveYearId(db, organizationId);
  const pupils = await db.pupil.findMany({
    where: { organizationId, familyId: null, isActive: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      lastName: true,
      firstName: true,
      middleName: true,
      enrollments: {
        ...(yearId ? { where: { academicYearId: yearId, endsOn: null }, take: 1 } : { take: 0 }),
        select: { grade: { select: { name: true } } },
      },
    },
  });

  return {
    ok: true,
    data: pupils.map((pupil) => ({
      pupilId: pupil.id,
      displayName: formatDisplayName(pupil),
      groupName: pupil.enrollments[0]?.grade.name ?? null,
    })),
  };
}
