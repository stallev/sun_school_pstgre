import "server-only";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  LESSON_STATUS,
  MUTATION_ERROR_CODES,
  completeLessonCheckInputSchema,
  type LessonStatus,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma } from "@sunschool/db";
import type { PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import {
  assertLessonActorForExisting,
  lessonDateToIso,
  loadActorOrganizationId,
  loadLessonInOrganization,
  lockLessonYearAndAssertActive,
} from "../lessons/lesson-shared.server";

type Tx = Prisma.TransactionClient;

export async function completeLessonCheckInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  lessonId: string,
): Promise<MutationResult<{ lessonId: string; status: LessonStatus }>> {
  const lesson = await loadLessonInOrganization(tx, lessonId, organizationId);
  if (isMutationErr(lesson)) return lesson;

  const actor = await assertLessonActorForExisting(tx, actorUserId, organizationId, lesson);
  if (isMutationErr(actor)) return actor;

  const lessonDateIso = lessonDateToIso(lesson.lessonDate);
  const year = await lockLessonYearAndAssertActive(tx, lesson.academicYearId, organizationId, lessonDateIso);
  if (isMutationErr(year)) return year;

  const locked = await tx.$queryRaw<{ status: LessonStatus }[]>`
    SELECT status FROM lesson WHERE id = ${lessonId}::uuid FOR UPDATE
  `;
  const status = locked[0]?.status;
  if (!status) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  if (status === LESSON_STATUS.CHECK_COMPLETED) {
    return { ok: true, data: { lessonId, status: LESSON_STATUS.CHECK_COMPLETED } };
  }

  if (status !== LESSON_STATUS.HELD) {
    return { ok: false, code: MUTATION_ERROR_CODES.FORBIDDEN, message: "common.errors.forbidden" };
  }

  const checkedCount = await tx.homeworkCheck.count({
    where: { lessonId, homeworkChecked: true },
  });
  if (checkedCount === 0) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.CHECK_NOTHING_CHECKED,
      message: "teacher.check.nothing_checked",
    };
  }

  await tx.lesson.update({
    where: { id: lessonId },
    data: { status: LESSON_STATUS.CHECK_COMPLETED },
  });

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.LESSON,
    entityId: lessonId,
    action: AUDIT_ACTION.LESSON_CHECK_COMPLETED,
    newValue: { gradeId: lesson.gradeId, academicYearId: lesson.academicYearId },
  });

  return { ok: true, data: { lessonId, status: LESSON_STATUS.CHECK_COMPLETED } };
}

export async function completeLessonCheck(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<{ lessonId: string; status: LessonStatus }>> {
  const parsed = completeLessonCheckInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    return completeLessonCheckInTransaction(tx, actorUserId, organizationId, parsed.data.lessonId);
  });
}
