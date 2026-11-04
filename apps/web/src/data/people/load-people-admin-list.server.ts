import "server-only";

import { ACADEMIC_YEAR_STATUS, CONSENT_STATUS } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { getDefaultOrganizationId } from "@/data/access/get-organization-id.server";
import {
  clampPeoplePage,
  PEOPLE_PAGE_SIZE,
  type ParsedPeopleListQuery,
} from "@/lib/people/parse-people-filter";
import { formatDisplayName } from "@/lib/person/format-display-name";
import { hasEnrollableConsentStatus } from "@/data/school/pupil-consent-view.server";
import { isoTodayUtc } from "@/data/school/school-pupil-shared.server";
import { PEOPLE_LIST_FILTER, type PeopleListFilter } from "./people-list-filters";

export { PEOPLE_LIST_FILTER, type PeopleListFilter } from "./people-list-filters";
export { parsePeopleListFilter } from "@/lib/people/parse-people-filter";

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
  totalMatching: number;
  visibleCount: number;
  remainingCount: number;
  page: number;
  activeGroupId: string | undefined;
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

const applyListFilter = (rows: PupilListRow[], filter: PeopleListFilter): PupilListRow[] => {
  if (filter === PEOPLE_LIST_FILTER.INACTIVE) {
    return rows.filter((row) => !row.isActive);
  }
  if (filter === PEOPLE_LIST_FILTER.UNASSIGNED) {
    return rows.filter((row) => row.isActive && row.groupName === null);
  }
  if (filter === PEOPLE_LIST_FILTER.LEGACY) {
    return rows.filter((row) => row.isActive && row.hasEnrollableConsent && !row.consentPaperActive);
  }
  return rows;
};

export async function loadPeopleAdminList(
  db: PrismaClient,
  query: ParsedPeopleListQuery,
): Promise<PeopleAdminListData> {
  const { filter, groupId: groupIdRaw, page: pageRaw, searchTerm } = query;
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

  const validGroupIds = new Set(groups.map((group) => group.gradeId));
  const activeGroupId =
    groupIdRaw && validGroupIds.has(groupIdRaw) ? groupIdRaw : undefined;

  if (filter === PEOPLE_LIST_FILTER.LEGACY) {
    return {
      yearId: year?.id ?? null,
      pupils: [],
      groups,
      totalMatching: 0,
      visibleCount: 0,
      remainingCount: 0,
      page: 1,
      activeGroupId,
    };
  }

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

  const nameFilter =
    searchTerm && searchTerm.length > 0
      ? {
          OR: [
            { lastName: { contains: searchTerm, mode: "insensitive" as const } },
            { firstName: { contains: searchTerm, mode: "insensitive" as const } },
            { middleName: { contains: searchTerm, mode: "insensitive" as const } },
          ],
        }
      : {};

  const pupilsRaw = await db.pupil.findMany({
    where: { organizationId, ...nameFilter },
    orderBy: [{ isActive: "desc" }, { lastName: "asc" }, { firstName: "asc" }],
    select: pupilSelect,
  });

  const mapped: PupilListRow[] = pupilsRaw.map((pupil) => {
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
  });

  let filtered = applyListFilter(mapped, filter);
  if (activeGroupId) {
    filtered = filtered.filter((row) => row.gradeId === activeGroupId);
  }

  const totalMatching = filtered.length;
  const page = clampPeoplePage(pageRaw, totalMatching);
  const visibleCount = Math.min(totalMatching, page * PEOPLE_PAGE_SIZE);
  const pupils = filtered.slice(0, visibleCount);
  const remainingCount = Math.max(0, totalMatching - visibleCount);

  return {
    yearId: year?.id ?? null,
    pupils,
    groups,
    totalMatching,
    visibleCount,
    remainingCount,
    page,
    activeGroupId,
  };
}
