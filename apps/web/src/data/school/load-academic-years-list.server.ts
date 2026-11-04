import "server-only";

import type { AcademicYearStatus } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";

export type AcademicYearListRow = {
  yearId: string;
  name: string;
  startsOn: string;
  endsOn: string;
  status: AcademicYearStatus;
  lessonCount: number;
  groupCount: number;
  pupilCount: number;
};

async function loadYearStats(
  db: PrismaClient,
  yearId: string,
): Promise<{ lessonCount: number; groupCount: number; pupilCount: number }> {
  const [lessonCount, enrollments] = await Promise.all([
    db.lesson.count({ where: { academicYearId: yearId } }),
    db.enrollment.findMany({
      where: { academicYearId: yearId, endsOn: null },
      select: { pupilId: true, gradeId: true },
    }),
  ]);
  const pupilCount = new Set(enrollments.map((row) => row.pupilId)).size;
  const groupCount = new Set(enrollments.map((row) => row.gradeId)).size;
  return { lessonCount, groupCount, pupilCount };
}

export async function loadAcademicYearsList(
  db: PrismaClient,
  organizationId: string,
): Promise<AcademicYearListRow[]> {
  const rows = await db.academicYear.findMany({
    where: { organizationId },
    orderBy: [{ startsOn: "desc" }],
    select: {
      id: true,
      name: true,
      startsOn: true,
      endsOn: true,
      status: true,
    },
  });

  const stats = await Promise.all(rows.map((row) => loadYearStats(db, row.id)));

  return rows.map((row, index) => ({
    yearId: row.id,
    name: row.name,
    startsOn: row.startsOn.toISOString().slice(0, 10),
    endsOn: row.endsOn.toISOString().slice(0, 10),
    status: row.status as AcademicYearStatus,
    lessonCount: stats[index]?.lessonCount ?? 0,
    groupCount: stats[index]?.groupCount ?? 0,
    pupilCount: stats[index]?.pupilCount ?? 0,
  }));
}
