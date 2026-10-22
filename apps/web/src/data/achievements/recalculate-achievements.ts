import "server-only";
import { z } from "zod";
import {
  ACADEMIC_YEAR_STATUS,
  LESSON_STATUS,
  MUTATION_ERROR_CODES,
  type MutationResult,
} from "@sunschool/domain";
import type { Prisma, PrismaClient } from "@sunschool/db";
import { mutationFromZodError } from "../access/map-zod-fields";
import { assertAdminActor } from "../school/school-enrollment-shared.server";
import { loadActorOrganizationId } from "../school/school-pupil-shared.server";
import { evaluatePupilInTransaction } from "./evaluate-pupil";
import { readFeaturesAchievementsEnabled } from "./achievement-feature.server";

type Tx = Prisma.TransactionClient;

const recalculateAchievementsInputSchema = z
  .object({
    yearId: z.string().uuid().optional(),
  })
  .strict();

export type RecalculateAchievementsSuccess = { awardIds: string[]; pupilsEvaluated: number };

export async function recalculateAchievementsInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: z.infer<typeof recalculateAchievementsInputSchema>,
): Promise<MutationResult<RecalculateAchievementsSuccess>> {
  const adminError = await assertAdminActor(tx, actorUserId);
  if (adminError) return adminError;

  const flagOn = await readFeaturesAchievementsEnabled(tx);
  if (!flagOn) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.ACHIEVEMENT_FLAG_OFF,
      message: "admin.achievements.flag_off",
    };
  }

  const year =
    input.yearId !== undefined
      ? await tx.academicYear.findFirst({
          where: { id: input.yearId, organizationId },
          select: { id: true, status: true },
        })
      : await tx.academicYear.findFirst({
          where: { organizationId, status: ACADEMIC_YEAR_STATUS.ACTIVE },
          select: { id: true, status: true },
        });

  if (!year) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const pupilGroups = await tx.homeworkCheck.groupBy({
    by: ["pupilId"],
    where: {
      homeworkChecked: true,
      lesson: { academicYearId: year.id, status: LESSON_STATUS.CHECK_COMPLETED },
      pupil: { organizationId },
    },
  });

  const pupilsById = new Map<string, { gradeId: string; academicYearId: string }>();
  for (const row of pupilGroups) {
    const sample = await tx.homeworkCheck.findFirst({
      where: {
        pupilId: row.pupilId,
        homeworkChecked: true,
        lesson: { academicYearId: year.id, status: LESSON_STATUS.CHECK_COMPLETED },
      },
      select: { lesson: { select: { gradeId: true, academicYearId: true } } },
      orderBy: [{ lesson: { lessonDate: "desc" } }],
    });
    if (!sample) continue;
    pupilsById.set(row.pupilId, {
      gradeId: sample.lesson.gradeId,
      academicYearId: sample.lesson.academicYearId,
    });
  }

  const enabledGrades = await tx.gradeSettings.findMany({
    where: { academicYearId: year.id, achievementsEnabled: true },
    select: { gradeId: true },
  });
  const enabledGradeIds = new Set(enabledGrades.map((row) => row.gradeId));

  const awardIds: string[] = [];
  let pupilsEvaluated = 0;

  for (const [pupilId, scope] of pupilsById) {
    if (!enabledGradeIds.has(scope.gradeId)) continue;
    pupilsEvaluated += 1;
    const result = await evaluatePupilInTransaction(
      tx,
      actorUserId,
      pupilId,
      scope.academicYearId,
      scope.gradeId,
    );
    awardIds.push(...result.awardIds);
  }

  return { ok: true, data: { awardIds, pupilsEvaluated } };
}

export async function recalculateAchievements(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<RecalculateAchievementsSuccess>> {
  const parsed = recalculateAchievementsInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    return recalculateAchievementsInTransaction(tx, actorUserId, organizationId, parsed.data);
  });
}
