import "server-only";
import { ACADEMIC_YEAR_STATUS } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";

export type ActiveGradeOption = {
  gradeId: string;
  name: string;
};

export async function loadActiveGrades(
  db: PrismaClient,
  organizationId: string,
): Promise<ActiveGradeOption[]> {
  const year = await db.academicYear.findFirst({
    where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
    select: { id: true },
  });
  if (!year) return [];

  const settings = await db.gradeSettings.findMany({
    where: { academicYearId: year.id, grade: { organizationId, isActive: true } },
    select: { grade: { select: { id: true, name: true } } },
    orderBy: { grade: { name: "asc" } },
  });

  return settings.map((entry) => ({
    gradeId: entry.grade.id,
    name: entry.grade.name,
  }));
}
