import "server-only";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  deleteLessonInputSchema,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type PrismaClient } from "@sunschool/db";
import { isMutationErr, userHasAdminRole } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import {
  assertLessonActorForExisting,
  lessonHasHomeworkChecks,
  loadActorOrganizationId,
  loadLessonInOrganization,
  recalculateLessonOrdinals,
} from "./lesson-shared.server";

async function deleteLessonGraph(tx: Parameters<typeof loadLessonInOrganization>[0], lessonId: string): Promise<void> {
  const checks = await tx.homeworkCheck.findMany({
    where: { lessonId },
    select: { id: true },
  });
  const checkIds = checks.map((row) => row.id);
  if (checkIds.length > 0) {
    await tx.homeworkScoreEvent.deleteMany({ where: { checkId: { in: checkIds } } });
    await tx.homeworkVerseScore.deleteMany({ where: { checkId: { in: checkIds } } });
    await tx.homeworkCheck.deleteMany({ where: { id: { in: checkIds } } });
  }
  await tx.lessonGoldenVerse.deleteMany({ where: { lessonId } });
  await tx.gradeEvent.updateMany({ where: { lessonId }, data: { lessonId: null } });
  await tx.lesson.delete({ where: { id: lessonId } });
}

export async function deleteLesson(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = deleteLessonInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }

    const lesson = await loadLessonInOrganization(tx, parsed.data.lessonId, organizationId);
    if (isMutationErr(lesson)) return lesson;

    const actor = await assertLessonActorForExisting(tx, actorUserId, organizationId, lesson);
    if (isMutationErr(actor)) return actor;

    const hasChecks = await lessonHasHomeworkChecks(tx, lesson.id);
    const isAdmin = await userHasAdminRole(tx, actorUserId);
    if (!isAdmin && hasChecks) {
      return { ok: false, code: MUTATION_ERROR_CODES.FORBIDDEN, message: "common.errors.forbidden" };
    }

    await deleteLessonGraph(tx, lesson.id);
    await recalculateLessonOrdinals(tx, lesson.gradeId, lesson.academicYearId);

    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.LESSON,
      entityId: lesson.id,
      action: AUDIT_ACTION.LESSON_DELETED,
      oldValue: { gradeId: lesson.gradeId, title: lesson.title },
    });

    return { ok: true };
  });
}
