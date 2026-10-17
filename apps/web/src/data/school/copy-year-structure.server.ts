import "server-only";
import {
  ACADEMIC_YEAR_STATUS,
  defaultGradeScoreWeights,
  DEFAULT_MAX_VERSES_PER_LESSON,
  DEFAULT_RECITATION_DAYS_N,
} from "@sunschool/domain";
import type { Prisma } from "@sunschool/db";

type Tx = Prisma.TransactionClient;

/** Copies `grade_settings` and `teacher_assignment` from the latest prior year (§5.1). */
export async function copyYearStructureFromPriorYear(
  tx: Tx,
  organizationId: string,
  newYearId: string,
): Promise<void> {
  const activeSource = await tx.academicYear.findFirst({
    where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
    select: { id: true },
  });
  const sourceYear =
    activeSource ??
    (await tx.academicYear.findFirst({
      where: { organizationId, status: ACADEMIC_YEAR_STATUS.CLOSED },
      orderBy: { endsOn: "desc" },
      select: { id: true },
    }));

  const activeGrades = await tx.grade.findMany({
    where: { organizationId, isActive: true },
    select: { id: true },
  });
  if (activeGrades.length === 0) return;

  const defaultWeights = defaultGradeScoreWeights();

  if (sourceYear) {
    const priorSettings = await tx.gradeSettings.findMany({
      where: {
        academicYearId: sourceYear.id,
        gradeId: { in: activeGrades.map((grade) => grade.id) },
      },
    });
    const settingsByGrade = new Map(priorSettings.map((row) => [row.gradeId, row]));

    for (const grade of activeGrades) {
      const prior = settingsByGrade.get(grade.id);
      await tx.gradeSettings.create({
        data: {
          gradeId: grade.id,
          academicYearId: newYearId,
          useVerses: prior?.useVerses ?? true,
          useTest: prior?.useTest ?? true,
          useNotebook: prior?.useNotebook ?? true,
          useSinging: prior?.useSinging ?? true,
          maxVersesPerLesson: prior?.maxVersesPerLesson ?? DEFAULT_MAX_VERSES_PER_LESSON,
          labels: prior?.labels ?? {},
          weights: prior?.weights ?? defaultWeights,
          recitationDaysN: prior?.recitationDaysN ?? DEFAULT_RECITATION_DAYS_N,
          achievementsEnabled: prior?.achievementsEnabled ?? false,
        },
      });
    }

    const priorAssignments = await tx.teacherAssignment.findMany({
      where: {
        academicYearId: sourceYear.id,
        gradeId: { in: activeGrades.map((grade) => grade.id) },
      },
    });
    for (const assignment of priorAssignments) {
      await tx.teacherAssignment.create({
        data: {
          userId: assignment.userId,
          gradeId: assignment.gradeId,
          academicYearId: newYearId,
        },
      });
    }
    return;
  }

  for (const grade of activeGrades) {
    await tx.gradeSettings.create({
      data: {
        gradeId: grade.id,
        academicYearId: newYearId,
        maxVersesPerLesson: DEFAULT_MAX_VERSES_PER_LESSON,
        labels: {},
        weights: defaultWeights,
        recitationDaysN: DEFAULT_RECITATION_DAYS_N,
      },
    });
  }
}
