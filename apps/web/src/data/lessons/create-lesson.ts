import "server-only";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  LESSON_STATUS,
  MUTATION_ERROR_CODES,
  createLessonInputSchema,
  type CreateLessonInput,
  type MutationResult,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { loadGradeInOrganization } from "../school/school-group-shared.server";
import { replaceLessonGoldenVerses, validateLessonVerseRanges } from "./lesson-verses.server";
import {
  assertLeadTeacherOnGrade,
  assertLessonActorForGrade,
  ensureLessonGradeEvent,
  isoToLessonDate,
  loadActorOrganizationId,
  lockLessonYearAndAssertActive,
  recalculateLessonOrdinals,
} from "./lesson-shared.server";

type Tx = Prisma.TransactionClient;

export async function createLessonInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: CreateLessonInput,
): Promise<MutationResult<{ lessonId: string }>> {
  const actor = await assertLessonActorForGrade(tx, actorUserId, organizationId, input.gradeId);
  if (isMutationErr(actor)) return actor;

  const grade = await loadGradeInOrganization(tx, input.gradeId, organizationId);
  if (isMutationErr(grade)) return grade;
  if (!grade.isActive) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }

  const year = await lockLessonYearAndAssertActive(tx, actor.year.id, organizationId, input.lessonDate);
  if (isMutationErr(year)) return year;

  const settings = await tx.gradeSettings.findUnique({
    where: { gradeId_academicYearId: { gradeId: input.gradeId, academicYearId: year.id } },
    select: { maxVersesPerLesson: true },
  });
  const maxVerses = settings?.maxVersesPerLesson ?? 3;

  const versesError = await validateLessonVerseRanges(tx, grade.language, input.verses, maxVerses);
  if (versesError) return versesError;

  const leadError = await assertLeadTeacherOnGrade(
    tx,
    input.leadTeacherId,
    input.gradeId,
    year.id,
    organizationId,
  );
  if (leadError) return leadError;

  const lesson = await tx.lesson.create({
    data: {
      gradeId: input.gradeId,
      academicYearId: year.id,
      title: input.title,
      lessonDate: isoToLessonDate(input.lessonDate),
      ordinal: 1,
      leadTeacherId: input.leadTeacherId,
      kind: input.kind,
      body: input.body ?? null,
      hasTest: input.hasTest,
      status: LESSON_STATUS.HELD,
    },
    select: { id: true, gradeId: true, title: true, lessonDate: true },
  });

  await replaceLessonGoldenVerses(tx, organizationId, lesson.id, input.verses);
  await recalculateLessonOrdinals(tx, lesson.gradeId, year.id);
  await ensureLessonGradeEvent(tx, lesson);

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.LESSON,
    entityId: lesson.id,
    action: AUDIT_ACTION.LESSON_CREATED,
    newValue: { gradeId: input.gradeId, lessonDate: input.lessonDate, kind: input.kind },
  });

  return { ok: true, data: { lessonId: lesson.id } };
}

export async function createLesson(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult<{ lessonId: string }>> {
  const parsed = createLessonInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    return createLessonInTransaction(tx, actorUserId, organizationId, parsed.data);
  });
}
