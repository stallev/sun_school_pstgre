import "server-only";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  MUTATION_ERROR_CODES,
  updateLessonInputSchema,
  type LessonKind,
  type MutationResult,
  type UpdateLessonInput,
} from "@sunschool/domain";
import { writeAudit, type Prisma, type PrismaClient } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import { mutationFromZodError } from "../access/map-zod-fields";
import { loadGradeInOrganization } from "../school/school-group-shared.server";
import { replaceLessonGoldenVerses, validateLessonVerseRanges } from "./lesson-verses.server";
import {
  assertLeadTeacherOnGrade,
  assertLessonActorForExisting,
  isoToLessonDate,
  lessonDateToIso,
  lessonHasHomeworkChecks,
  loadActorOrganizationId,
  loadLessonInOrganization,
  lockLessonYearAndAssertActive,
  recalculateLessonOrdinals,
} from "./lesson-shared.server";

type Tx = Prisma.TransactionClient;

const versesUnchanged = (
  existing: { goldenVerse: { bookId: string; startChapter: number; startVerse: number; endChapter: number; endVerse: number } }[],
  input: UpdateLessonInput,
): boolean => {
  if (existing.length !== input.verses.length) return false;
  for (let index = 0; index < existing.length; index += 1) {
    const row = existing[index]?.goldenVerse;
    const next = input.verses[index];
    if (!row || !next) return false;
    if (
      row.bookId !== next.bookId ||
      row.startChapter !== next.startChapter ||
      row.startVerse !== next.startVerse ||
      row.endChapter !== next.endChapter ||
      row.endVerse !== next.endVerse
    ) {
      return false;
    }
  }
  return true;
};

export async function updateLessonInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: UpdateLessonInput,
): Promise<MutationResult> {
  const lesson = await loadLessonInOrganization(tx, input.lessonId, organizationId);
  if (isMutationErr(lesson)) return lesson;

  const actor = await assertLessonActorForExisting(tx, actorUserId, organizationId, lesson);
  if (isMutationErr(actor)) return actor;

  const hasChecks = await lessonHasHomeworkChecks(tx, lesson.id);
  const lessonDateIso = lessonDateToIso(lesson.lessonDate);

  if (hasChecks) {
    if (
      input.lessonDate !== lessonDateIso ||
      input.kind !== lesson.kind ||
      input.hasTest !== lesson.hasTest
    ) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.VALIDATION,
        message: "teacher.lesson.verse_locked",
        fields: { verses: "teacher.lesson.verse_locked" },
      };
    }
    const linked = await tx.lessonGoldenVerse.findMany({
      where: { lessonId: lesson.id },
      orderBy: { position: "asc" },
      select: {
        goldenVerse: {
          select: {
            bookId: true,
            startChapter: true,
            startVerse: true,
            endChapter: true,
            endVerse: true,
          },
        },
      },
    });
    if (!versesUnchanged(linked, input)) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.CHECK_VERSE_LOCKED,
        message: "teacher.lesson.verse_locked",
        fields: { verses: "teacher.lesson.verse_locked" },
      };
    }
  } else {
    const year = await lockLessonYearAndAssertActive(
      tx,
      lesson.academicYearId,
      organizationId,
      input.lessonDate,
    );
    if (isMutationErr(year)) return year;
  }

  const grade = await loadGradeInOrganization(tx, lesson.gradeId, organizationId);
  if (isMutationErr(grade)) return grade;

  if (!hasChecks) {
    const settings = await tx.gradeSettings.findUnique({
      where: {
        gradeId_academicYearId: { gradeId: lesson.gradeId, academicYearId: lesson.academicYearId },
      },
      select: { maxVersesPerLesson: true },
    });
    const maxVerses = settings?.maxVersesPerLesson ?? 3;
    const versesError = await validateLessonVerseRanges(tx, grade.language, input.verses, maxVerses);
    if (versesError) return versesError;
  }

  const leadError = await assertLeadTeacherOnGrade(
    tx,
    input.leadTeacherId,
    lesson.gradeId,
    lesson.academicYearId,
    organizationId,
  );
  if (leadError) return leadError;

  await tx.lesson.update({
    where: { id: lesson.id },
    data: {
      title: input.title,
      lessonDate: hasChecks ? lesson.lessonDate : isoToLessonDate(input.lessonDate),
      kind: hasChecks ? (lesson.kind as LessonKind) : input.kind,
      body: input.body ?? null,
      hasTest: hasChecks ? lesson.hasTest : input.hasTest,
      leadTeacherId: input.leadTeacherId,
    },
  });

  if (!hasChecks) {
    await replaceLessonGoldenVerses(tx, organizationId, lesson.id, input.verses);
    await recalculateLessonOrdinals(tx, lesson.gradeId, lesson.academicYearId);
  }

  await tx.gradeEvent.updateMany({
    where: { lessonId: lesson.id },
    data: { title: input.title, eventDate: hasChecks ? lesson.lessonDate : isoToLessonDate(input.lessonDate) },
  });

  await writeAudit(tx, {
    actorUserId,
    source: AUDIT_SOURCE.USER,
    entityType: AUDIT_ENTITY_TYPE.LESSON,
    entityId: lesson.id,
    action: AUDIT_ACTION.LESSON_UPDATED,
    oldValue: { title: lesson.title, leadTeacherId: lesson.leadTeacherId },
    newValue: { title: input.title, leadTeacherId: input.leadTeacherId },
  });

  return { ok: true };
}

export async function updateLesson(
  db: PrismaClient,
  actorUserId: string,
  raw: unknown,
): Promise<MutationResult> {
  const parsed = updateLessonInputSchema.safeParse(raw);
  if (!parsed.success) return mutationFromZodError(parsed.error);

  return db.$transaction(async (tx) => {
    const organizationId = await loadActorOrganizationId(tx, actorUserId);
    if (!organizationId) {
      return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
    }
    return updateLessonInTransaction(tx, actorUserId, organizationId, parsed.data);
  });
}
