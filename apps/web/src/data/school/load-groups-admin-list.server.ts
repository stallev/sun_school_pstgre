import "server-only";
import {
  ACADEMIC_YEAR_STATUS,
  APP_LOCALE,
  type AppLocale,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { getDefaultOrganizationId } from "@/data/access/get-organization-id.server";

export type GroupListRow = {
  gradeId: string;
  name: string;
  language: AppLocale;
  isActive: boolean;
  teacherCount: number;
};

export type GroupsAdminListData = {
  yearId: string | null;
  yearName: string | null;
  yearStatus: string | null;
  groups: GroupListRow[];
};

export async function loadGroupsAdminList(db: PrismaClient): Promise<GroupsAdminListData> {
  const organizationId = await getDefaultOrganizationId(db);
  const year = await db.academicYear.findFirst({
    where: {
      organizationId,
      status: { in: [ACADEMIC_YEAR_STATUS.ACTIVE, ACADEMIC_YEAR_STATUS.DRAFT] },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: { id: true, name: true, status: true },
  });

  if (!year) {
    return { yearId: null, yearName: null, yearStatus: null, groups: [] };
  }

  const settings = await db.gradeSettings.findMany({
    where: { academicYearId: year.id, grade: { organizationId } },
    select: {
      grade: {
        select: {
          id: true,
          name: true,
          language: true,
          isActive: true,
        },
      },
    },
    orderBy: { grade: { name: "asc" } },
  });

  const gradeIds = settings.map((entry) => entry.grade.id);
  const assignmentCounts =
    gradeIds.length === 0
      ? []
      : await db.teacherAssignment.groupBy({
          by: ["gradeId"],
          where: { academicYearId: year.id, gradeId: { in: gradeIds } },
          _count: { _all: true },
        });

  const countByGrade = new Map(assignmentCounts.map((row) => [row.gradeId, row._count._all]));

  const groups: GroupListRow[] = settings.map((entry) => ({
    gradeId: entry.grade.id,
    name: entry.grade.name,
    language: entry.grade.language as AppLocale,
    isActive: entry.grade.isActive,
    teacherCount: countByGrade.get(entry.grade.id) ?? 0,
  }));

  return {
    yearId: year.id,
    yearName: year.name,
    yearStatus: year.status,
    groups,
  };
}

export const formatGroupLanguageLabel = (language: AppLocale): string =>
  language === APP_LOCALE.EN ? "EN" : "RU";
