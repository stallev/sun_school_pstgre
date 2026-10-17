import "server-only";
import { ACADEMIC_YEAR_STATUS, CONSENT_STATUS } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { getDefaultOrganizationId } from "@/data/access/get-organization-id.server";
import { formatDisplayName } from "@/lib/person/format-display-name";
import { hasEnrollableConsentStatus } from "./pupil-consent-view.server";
import { isoTodayUtc } from "./school-pupil-shared.server";

export const PEOPLE_LIST_FILTER = {
  ALL: "all",
  UNASSIGNED: "unassigned",
  INACTIVE: "inactive",
} as const;

export type PeopleListFilter =
  (typeof PEOPLE_LIST_FILTER)[keyof typeof PEOPLE_LIST_FILTER];

export type PeopleGroupOption = {
  gradeId: string;
  name: string;
  isActive: boolean;
};

export type PupilListRow = {
  pupilId: string;
  displayName: string;
  lastName: string;
  firstName: string;
  middleName: string;
  birthDateIso: string | null;
  isActive: boolean;
  groupName: string | null;
  gradeId: string | null;
  hasEnrollableConsent: boolean;
  consentPaperActive: boolean;
};

export type PeopleAdminListData = {
  yearId: string | null;
  pupils: PupilListRow[];
  groups: PeopleGroupOption[];
};

export const parsePeopleListFilter = (raw: string | undefined): PeopleListFilter => {
  if (raw === PEOPLE_LIST_FILTER.UNASSIGNED || raw === PEOPLE_LIST_FILTER.INACTIVE) {
    return raw;
  }
  return PEOPLE_LIST_FILTER.ALL;
};

const resolveAdminConsentFlags = (
  statuses: { status: string }[],
  todayIso: string,
  legacyDeadlineOn: string | null,
): { hasEnrollableConsent: boolean; consentPaperActive: boolean } => {
  const hasActive = statuses.some((row) => row.status === CONSENT_STATUS.ACTIVE);
  if (hasActive) {
    return { hasEnrollableConsent: true, consentPaperActive: true };
  }
  const hasLegacy =
    statuses.some((row) => row.status === CONSENT_STATUS.LEGACY_PENDING) &&
    hasEnrollableConsentStatus(CONSENT_STATUS.LEGACY_PENDING, todayIso, legacyDeadlineOn);
  return { hasEnrollableConsent: hasLegacy, consentPaperActive: false };
};

export async function loadPeopleAdminList(
  db: PrismaClient,
  filter: PeopleListFilter,
): Promise<PeopleAdminListData> {
  const organizationId = await getDefaultOrganizationId(db);
  const todayIso = isoTodayUtc();

  const year = await db.academicYear.findFirst({
    where: {
      organizationId,
      status: { in: [ACADEMIC_YEAR_STATUS.ACTIVE, ACADEMIC_YEAR_STATUS.DRAFT] },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: { id: true },
  });

  const legacyRow = await db.appSetting.findUnique({
    where: { key: "legacy_consent_deadline_on" },
    select: { value: true },
  });
  const legacyDeadlineOn =
    legacyRow?.value && typeof legacyRow.value === "string" ? legacyRow.value : null;

  const gradeSettings = year
    ? await db.gradeSettings.findMany({
        where: { academicYearId: year.id, grade: { organizationId } },
        select: {
          grade: { select: { id: true, name: true, isActive: true } },
        },
        orderBy: { grade: { name: "asc" } },
      })
    : [];

  const groups: PeopleGroupOption[] = gradeSettings.map((entry) => ({
    gradeId: entry.grade.id,
    name: entry.grade.name,
    isActive: entry.grade.isActive,
  }));

  const pupilSelect = {
    id: true,
    lastName: true,
    firstName: true,
    middleName: true,
    birthDate: true,
    isActive: true,
    consents: { select: { status: true } },
    enrollments: {
      ...(year
        ? { where: { academicYearId: year.id, endsOn: null }, take: 1 }
        : { take: 0 }),
      select: { grade: { select: { id: true, name: true } } },
    },
  } as const;

  const pupilsRaw = await db.pupil.findMany({
    where: { organizationId },
    orderBy: [{ isActive: "desc" }, { lastName: "asc" }, { firstName: "asc" }],
    select: pupilSelect,
  });

  const pupils: PupilListRow[] = pupilsRaw
    .map((pupil) => {
      const consentFlags = resolveAdminConsentFlags(pupil.consents, todayIso, legacyDeadlineOn);
      const enrollment = Array.isArray(pupil.enrollments) ? pupil.enrollments[0] : undefined;
      return {
        pupilId: pupil.id,
        displayName: formatDisplayName(pupil),
        lastName: pupil.lastName,
        firstName: pupil.firstName,
        middleName: pupil.middleName ?? "",
        birthDateIso: pupil.birthDate ? pupil.birthDate.toISOString().slice(0, 10) : null,
        isActive: pupil.isActive,
        groupName: enrollment?.grade.name ?? null,
        gradeId: enrollment?.grade.id ?? null,
        ...consentFlags,
      };
    })
    .filter((row) => {
      if (filter === PEOPLE_LIST_FILTER.INACTIVE) return !row.isActive;
      if (filter === PEOPLE_LIST_FILTER.UNASSIGNED) {
        return row.isActive && row.groupName === null;
      }
      return true;
    });

  return { yearId: year?.id ?? null, pupils, groups };
}
