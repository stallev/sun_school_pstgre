import "server-only";
import {
  ACADEMIC_YEAR_STATUS,
  APP_LOCALE,
  BIBLE_TRANSLATION_STATUS,
  type AppLocale,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { getDefaultOrganizationId } from "@/data/access/get-organization-id.server";
import { formatDisplayName } from "@/lib/person/format-display-name";

export type GroupTeacherAssignment = {
  userId: string;
  displayName: string;
};

export type GroupGradeSettingsView = {
  useVerses: boolean;
  useTest: boolean;
  useNotebook: boolean;
  useSinging: boolean;
  maxVersesPerLesson: number;
  labels: Record<string, string>;
  weights: Record<string, number>;
  recitationDaysN: number;
};

export type GroupAdminDetail = {
  gradeId: string;
  name: string;
  language: AppLocale;
  isActive: boolean;
  yearId: string;
  yearName: string;
  yearStatus: string;
  englishBibleReady: boolean;
  settings: GroupGradeSettingsView;
  assignments: GroupTeacherAssignment[];
};

export async function loadGroupAdminDetail(
  db: PrismaClient,
  gradeId: string,
): Promise<GroupAdminDetail | null> {
  const organizationId = await getDefaultOrganizationId(db);
  const grade = await db.grade.findFirst({
    where: { id: gradeId, organizationId },
    select: { id: true, name: true, language: true, isActive: true },
  });
  if (!grade) return null;

  const year = await db.academicYear.findFirst({
    where: {
      organizationId,
      status: { in: [ACADEMIC_YEAR_STATUS.ACTIVE, ACADEMIC_YEAR_STATUS.DRAFT] },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: { id: true, name: true, status: true },
  });
  if (!year) return null;

  const settingsRow = await db.gradeSettings.findFirst({
    where: { gradeId, academicYearId: year.id, grade: { organizationId } },
    select: {
      academicYearId: true,
      useVerses: true,
      useTest: true,
      useNotebook: true,
      useSinging: true,
      maxVersesPerLesson: true,
      labels: true,
      weights: true,
      recitationDaysN: true,
    },
  });
  if (!settingsRow) return null;

  const assignments = await db.teacherAssignment.findMany({
    where: { gradeId, academicYearId: settingsRow.academicYearId },
    select: {
      user: {
        select: { id: true, lastName: true, firstName: true, middleName: true },
      },
    },
    orderBy: { user: { lastName: "asc" } },
  });

  const englishRow = await db.bibleTranslation.findFirst({
    where: { locale: APP_LOCALE.EN, status: BIBLE_TRANSLATION_STATUS.READY },
    select: { id: true },
  });

  const weights = settingsRow.weights as Record<string, number>;
  const labels = settingsRow.labels as Record<string, string>;

  return {
    gradeId: grade.id,
    name: grade.name,
    language: grade.language as AppLocale,
    isActive: grade.isActive,
    yearId: year.id,
    yearName: year.name,
    yearStatus: year.status,
    englishBibleReady: englishRow !== null,
    settings: {
      useVerses: settingsRow.useVerses,
      useTest: settingsRow.useTest,
      useNotebook: settingsRow.useNotebook,
      useSinging: settingsRow.useSinging,
      maxVersesPerLesson: settingsRow.maxVersesPerLesson,
      labels,
      weights,
      recitationDaysN: settingsRow.recitationDaysN,
    },
    assignments: assignments.map((row) => ({
      userId: row.user.id,
      displayName: formatDisplayName(row.user),
    })),
  };
}
