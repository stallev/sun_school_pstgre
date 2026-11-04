import "server-only";
import {
  completeLessonCheckInputSchema,
  type LessonKind,
  MUTATION_ERROR_CODES,
  type MutationResult,
} from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { mutationFromZodError } from "../access/map-zod-fields";
import { revalidateBricksCachesForPupils } from "../bricks/revalidate-bricks-cache";
import { loadActorOrganizationId } from "../lessons/lesson-shared.server";
import {
  completeLessonCheckInTransaction,
  type CompleteLessonCheckSuccess,
} from "./complete-lesson-check";
import { loadCheckSchoolTimeZone, saveCheckInTransaction } from "./check-shared.server";

/**
 * Table "finish check": freeze every partial homework row already stored for the lesson,
 * then complete the lesson. Pupils with no row stay unchecked (homework_check_contract §5.8).
 */
export async function finishLessonTableCheck(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<CompleteLessonCheckSuccess>> {
  const parsed = completeLessonCheckInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  const [organizationId, schoolTimeZone] = await Promise.all([
    loadActorOrganizationId(db, actorUserId),
    loadCheckSchoolTimeZone(db),
  ]);
  if (!organizationId) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.NOT_FOUND,
      message: "common.errors.not_found",
    };
  }

  const result = await db.$transaction(async (tx) => {
    const partials = await tx.homeworkCheck.findMany({
      where: { lessonId: parsed.data.lessonId, homeworkChecked: false },
      select: { pupilId: true, lesson: { select: { kind: true } } },
    });

    for (const row of partials) {
      // Presence and scores stay on the row locked inside saveCheckInTransaction.
      // A value read here would be stale and could overwrite a save that committed
      // after this list was loaded (homework_check_contract §5.8, §12).
      const saved = await saveCheckInTransaction(
        tx,
        actorUserId,
        organizationId,
        {
          lessonId: parsed.data.lessonId,
          pupilId: row.pupilId,
          lessonKind: row.lesson.kind as LessonKind,
        },
        "checked",
        schoolTimeZone,
      );
      if (!saved.ok) return saved;
    }

    return completeLessonCheckInTransaction(
      tx,
      actorUserId,
      organizationId,
      parsed.data.lessonId,
    );
  });

  if (result.ok && result.data.bricksInvalidation) {
    revalidateBricksCachesForPupils(
      result.data.bricksInvalidation.pupilIds,
      result.data.bricksInvalidation.yearId,
    );
  }

  return result;
}
