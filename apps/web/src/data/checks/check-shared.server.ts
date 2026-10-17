import "server-only";
import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  AUDIT_SOURCE,
  computeLate,
  computePoints,
  buildScoringSnapshot,
  LESSON_KIND,
  nextLessonDate,
  MUTATION_ERROR_CODES,
  SCORE_SOURCE,
  type LessonKind,
  type MutationErr,
  type MutationResult,
  type SaveCheckedInput,
  type SavePartialCheckInput,
  type VerseScoreInput,
} from "@sunschool/domain";
import { Prisma, writeAudit } from "@sunschool/db";
import { isMutationErr } from "../access/access-admin-guards.server";
import {
  assertLessonActorForExisting,
  lessonDateToIso,
  loadLessonInOrganization,
  lockLessonYearAndAssertActive,
} from "../lessons/lesson-shared.server";

type Tx = Prisma.TransactionClient;

const APP_SETTING_SCHOOL_TIMEZONE_KEY = "school_timezone";
const DEFAULT_SCHOOL_TIMEZONE = "Europe/Moscow";

export const HOMEWORK_SCORE_EVENT_FIELD = {
  PRESENT: "present",
  TEST_SCORE: "test_score",
  NOTEBOOK_SCORE: "notebook_score",
  SINGING: "singing",
} as const;

export const verseScoreEventField = (lessonVerseId: string): string => `verse:${lessonVerseId}`;

const isScoringEventField = (field: string): boolean =>
  field === HOMEWORK_SCORE_EVENT_FIELD.TEST_SCORE ||
  field === HOMEWORK_SCORE_EVENT_FIELD.NOTEBOOK_SCORE ||
  field === HOMEWORK_SCORE_EVENT_FIELD.SINGING ||
  field.startsWith("verse:");

const valuesEqual = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

type CheckRow = {
  id: string;
  lessonId: string;
  pupilId: string;
  present: boolean;
  homeworkChecked: boolean;
  testScore: number | null;
  notebookScore: number | null;
  singing: boolean;
  comment: string | null;
  updatedAt: Date;
};

export type SaveCheckMode = "partial" | "checked";

export type CheckSaveInput = SavePartialCheckInput | SaveCheckedInput;

async function loadSchoolTimeZone(tx: Tx, organizationId: string): Promise<string> {
  const row = await tx.appSetting.findFirst({
    where: { organizationId, key: APP_SETTING_SCHOOL_TIMEZONE_KEY },
    select: { value: true },
  });
  const value = row?.value;
  return typeof value === "string" && value.length > 0 ? value : DEFAULT_SCHOOL_TIMEZONE;
}

async function assertPupilOnLesson(
  tx: Tx,
  pupilId: string,
  lesson: { gradeId: string; academicYearId: string; lessonDate: Date },
): Promise<MutationErr | null> {
  const enrollment = await tx.enrollment.findFirst({
    where: {
      pupilId,
      gradeId: lesson.gradeId,
      academicYearId: lesson.academicYearId,
      startsOn: { lte: lesson.lessonDate },
      OR: [{ endsOn: null }, { endsOn: { gte: lesson.lessonDate } }],
    },
    select: { id: true },
  });
  if (!enrollment) {
    return { ok: false, code: MUTATION_ERROR_CODES.NOT_FOUND, message: "common.errors.not_found" };
  }
  return null;
}

async function lockHomeworkCheckByLessonPupil(
  tx: Tx,
  lessonId: string,
  pupilId: string,
): Promise<CheckRow | null> {
  const rows = await tx.$queryRaw<CheckRow[]>`
    SELECT id, lesson_id AS "lessonId", pupil_id AS "pupilId", present,
           homework_checked AS "homeworkChecked", test_score AS "testScore",
           notebook_score AS "notebookScore", singing, comment, updated_at AS "updatedAt"
    FROM homework_check
    WHERE lesson_id = ${lessonId}::uuid AND pupil_id = ${pupilId}::uuid
    FOR UPDATE
  `;
  return rows[0] ?? null;
}

async function loadVerseScoreMap(tx: Tx, checkId: string): Promise<Map<string, number | null>> {
  const rows = await tx.homeworkVerseScore.findMany({
    where: { checkId },
    select: { lessonVerseId: true, score: true },
  });
  return new Map(rows.map((row) => [row.lessonVerseId, row.score]));
}

async function computeLateForCheck(
  tx: Tx,
  checkId: string,
  nextLessonDateIso: string | null,
  schoolTimeZone: string,
): Promise<boolean> {
  const events = await tx.homeworkScoreEvent.findMany({
    where: { checkId },
    select: { field: true, setAt: true },
  });
  for (const event of events) {
    if (!isScoringEventField(event.field)) continue;
    if (computeLate(event.setAt, nextLessonDateIso, schoolTimeZone)) {
      return true;
    }
  }
  return false;
}

async function recordScoreEvent(
  tx: Tx,
  checkId: string,
  actorUserId: string,
  field: string,
  value: unknown,
  setAt: Date,
): Promise<void> {
  await tx.homeworkScoreEvent.create({
    data: {
      checkId,
      field,
      value:
        value === undefined || value === null
          ? Prisma.DbNull
          : (value as Prisma.InputJsonValue),
      setAt,
      setById: actorUserId,
    },
  });
}

async function applyVerseScores(
  tx: Tx,
  checkId: string,
  actorUserId: string,
  verseScores: VerseScoreInput[] | undefined,
  existing: Map<string, number | null>,
  setAt: Date,
): Promise<boolean> {
  if (!verseScores) return false;
  let changed = false;
  for (const row of verseScores) {
    const previous = existing.get(row.lessonVerseId) ?? null;
    if (valuesEqual(previous, row.score)) continue;
    changed = true;
    await recordScoreEvent(tx, checkId, actorUserId, verseScoreEventField(row.lessonVerseId), row.score, setAt);
    if (row.score === null) {
      await tx.homeworkVerseScore.deleteMany({
        where: { checkId, lessonVerseId: row.lessonVerseId },
      });
      existing.delete(row.lessonVerseId);
    } else {
      await tx.homeworkVerseScore.upsert({
        where: { checkId_lessonVerseId: { checkId, lessonVerseId: row.lessonVerseId } },
        create: {
          checkId,
          lessonVerseId: row.lessonVerseId,
          score: row.score,
          source: SCORE_SOURCE.MANUAL,
          scoredAt: setAt,
          scoredById: actorUserId,
        },
        update: {
          score: row.score,
          source: SCORE_SOURCE.MANUAL,
          scoredAt: setAt,
          scoredById: actorUserId,
        },
      });
      existing.set(row.lessonVerseId, row.score);
    }
  }
  return changed;
}

async function applyScalarChanges(
  tx: Tx,
  checkId: string,
  actorUserId: string,
  input: CheckSaveInput,
  existing: CheckRow,
  setAt: Date,
): Promise<{ changed: boolean; data: Prisma.HomeworkCheckUpdateInput }> {
  const data: Prisma.HomeworkCheckUpdateInput = {};
  let changed = false;

  if (input.present !== undefined && input.present !== existing.present) {
    changed = true;
    data.present = input.present;
    await recordScoreEvent(
      tx,
      checkId,
      actorUserId,
      HOMEWORK_SCORE_EVENT_FIELD.PRESENT,
      input.present,
      setAt,
    );
  }
  if (input.testScore !== undefined && input.testScore !== existing.testScore) {
    changed = true;
    data.testScore = input.testScore;
    await recordScoreEvent(
      tx,
      checkId,
      actorUserId,
      HOMEWORK_SCORE_EVENT_FIELD.TEST_SCORE,
      input.testScore,
      setAt,
    );
  }
  if (input.notebookScore !== undefined && input.notebookScore !== existing.notebookScore) {
    changed = true;
    data.notebookScore = input.notebookScore;
    await recordScoreEvent(
      tx,
      checkId,
      actorUserId,
      HOMEWORK_SCORE_EVENT_FIELD.NOTEBOOK_SCORE,
      input.notebookScore,
      setAt,
    );
  }
  if (input.singing !== undefined && input.singing !== existing.singing) {
    changed = true;
    data.singing = input.singing;
    await recordScoreEvent(
      tx,
      checkId,
      actorUserId,
      HOMEWORK_SCORE_EVENT_FIELD.SINGING,
      input.singing,
      setAt,
    );
  }
  if (input.comment !== undefined && input.comment !== (existing.comment ?? undefined)) {
    changed = true;
    data.comment = input.comment ?? null;
  }

  return { changed, data };
}

function assertReviewLessonScoresAllowed(
  lessonKind: LessonKind,
  input: CheckSaveInput,
): MutationErr | null {
  if (lessonKind !== LESSON_KIND.REVIEW) {
    return null;
  }
  const hasTestScore = input.testScore !== undefined && input.testScore !== null;
  const hasVerseScores = input.verseScores !== undefined && input.verseScores.length > 0;
  if (!hasTestScore && !hasVerseScores) {
    return null;
  }
  const fields: Record<string, string> = {};
  if (hasTestScore) {
    fields.testScore = "teacher.lesson.review_no_verses";
  }
  if (hasVerseScores) {
    fields.verseScores = "teacher.lesson.review_no_verses";
  }
  return {
    ok: false,
    code: MUTATION_ERROR_CODES.VALIDATION,
    message: "teacher.lesson.review_no_verses",
    fields,
  };
}

function assertExpectedUpdatedAt(
  expectedUpdatedAt: string | undefined,
  existing: CheckRow | null,
): MutationErr | null {
  if (!existing) {
    if (expectedUpdatedAt) {
      return {
        ok: false,
        code: MUTATION_ERROR_CODES.CONFLICT,
        message: "teacher.check.conflict",
      };
    }
    return null;
  }
  if (!expectedUpdatedAt) return null;
  if (existing.updatedAt.toISOString() !== expectedUpdatedAt) {
    return {
      ok: false,
      code: MUTATION_ERROR_CODES.CONFLICT,
      message: "teacher.check.conflict",
    };
  }
  return null;
}

export async function saveCheckInTransaction(
  tx: Tx,
  actorUserId: string,
  organizationId: string,
  input: CheckSaveInput,
  mode: SaveCheckMode,
): Promise<MutationResult<{ checkId: string; updatedAt: string }>> {
  const lesson = await loadLessonInOrganization(tx, input.lessonId, organizationId);
  if (isMutationErr(lesson)) return lesson;

  const reviewScoresError = assertReviewLessonScoresAllowed(lesson.kind as LessonKind, input);
  if (reviewScoresError) return reviewScoresError;

  const actor = await assertLessonActorForExisting(tx, actorUserId, organizationId, lesson);
  if (isMutationErr(actor)) return actor;

  const lessonDateIso = lessonDateToIso(lesson.lessonDate);
  const year = await lockLessonYearAndAssertActive(tx, lesson.academicYearId, organizationId, lessonDateIso);
  if (isMutationErr(year)) return year;

  const pupilError = await assertPupilOnLesson(tx, input.pupilId, lesson);
  if (pupilError) return pupilError;

  const existing = await lockHomeworkCheckByLessonPupil(tx, input.lessonId, input.pupilId);
  const conflict = assertExpectedUpdatedAt(input.expectedUpdatedAt, existing);
  if (conflict) return conflict;

  if (mode === "partial" && existing?.homeworkChecked) {
    return { ok: false, code: MUTATION_ERROR_CODES.FORBIDDEN, message: "common.errors.forbidden" };
  }

  const setAt = new Date();
  const schoolTimeZone = await loadSchoolTimeZone(tx, organizationId);

  if (!existing) {
    const created = await tx.homeworkCheck.create({
      data: {
        lessonId: input.lessonId,
        pupilId: input.pupilId,
        present: input.present ?? false,
        homeworkChecked: false,
        testScore: input.testScore ?? null,
        notebookScore: input.notebookScore ?? null,
        singing: input.singing ?? false,
        comment: input.comment ?? null,
        checkedById: actorUserId,
        checkedAt: setAt,
      },
    });
    const verseMap = new Map<string, number | null>();
    if (input.present !== undefined) {
      await recordScoreEvent(
        tx,
        created.id,
        actorUserId,
        HOMEWORK_SCORE_EVENT_FIELD.PRESENT,
        input.present,
        setAt,
      );
    }
    if (input.testScore !== undefined) {
      await recordScoreEvent(
        tx,
        created.id,
        actorUserId,
        HOMEWORK_SCORE_EVENT_FIELD.TEST_SCORE,
        input.testScore,
        setAt,
      );
    }
    if (input.notebookScore !== undefined) {
      await recordScoreEvent(
        tx,
        created.id,
        actorUserId,
        HOMEWORK_SCORE_EVENT_FIELD.NOTEBOOK_SCORE,
        input.notebookScore,
        setAt,
      );
    }
    if (input.singing !== undefined) {
      await recordScoreEvent(
        tx,
        created.id,
        actorUserId,
        HOMEWORK_SCORE_EVENT_FIELD.SINGING,
        input.singing,
        setAt,
      );
    }
    await applyVerseScores(tx, created.id, actorUserId, input.verseScores, verseMap, setAt);

    if (mode === "checked") {
      return finalizeCheckedRecord(
        tx,
        actorUserId,
        input,
        created.id,
        lesson.kind as LessonKind,
        lesson.gradeId,
        lesson.academicYearId,
        lesson.id,
        schoolTimeZone,
        setAt,
        true,
      );
    }

    const refreshed = await tx.homeworkCheck.findUniqueOrThrow({
      where: { id: created.id },
      select: { id: true, updatedAt: true },
    });
    return { ok: true, data: { checkId: refreshed.id, updatedAt: refreshed.updatedAt.toISOString() } };
  }

  const verseMap = await loadVerseScoreMap(tx, existing.id);
  const scalar = await applyScalarChanges(tx, existing.id, actorUserId, input, existing, setAt);
  const versesChanged = await applyVerseScores(
    tx,
    existing.id,
    actorUserId,
    input.verseScores,
    verseMap,
    setAt,
  );
  const changed = scalar.changed || versesChanged;

  if (Object.keys(scalar.data).length > 0) {
    await tx.homeworkCheck.update({ where: { id: existing.id }, data: scalar.data });
  }

  if (mode === "partial") {
    const refreshed = await tx.homeworkCheck.findUniqueOrThrow({
      where: { id: existing.id },
      select: { id: true, updatedAt: true },
    });
    return { ok: true, data: { checkId: refreshed.id, updatedAt: refreshed.updatedAt.toISOString() } };
  }

  if (existing.homeworkChecked && !changed) {
    return {
      ok: true,
      data: { checkId: existing.id, updatedAt: existing.updatedAt.toISOString() },
    };
  }

  return finalizeCheckedRecord(
    tx,
    actorUserId,
    input,
    existing.id,
    lesson.kind as LessonKind,
    lesson.gradeId,
    lesson.academicYearId,
    lesson.id,
    schoolTimeZone,
    setAt,
    changed || !existing.homeworkChecked,
  );
}

async function finalizeCheckedRecord(
  tx: Tx,
  actorUserId: string,
  input: CheckSaveInput,
  checkId: string,
  lessonKind: LessonKind,
  gradeId: string,
  academicYearId: string,
  lessonId: string,
  schoolTimeZone: string,
  checkedAt: Date,
  shouldWriteAudit: boolean,
): Promise<MutationResult<{ checkId: string; updatedAt: string }>> {
  const settings = await tx.gradeSettings.findUnique({
    where: { gradeId_academicYearId: { gradeId, academicYearId } },
    select: {
      useVerses: true,
      useTest: true,
      useNotebook: true,
      useSinging: true,
      maxVersesPerLesson: true,
      weights: true,
    },
  });
  const weightsJson = (settings?.weights ?? {}) as Record<string, number>;
  const snapshot = buildScoringSnapshot({
    useVerses: settings?.useVerses ?? true,
    useTest: settings?.useTest ?? true,
    useNotebook: settings?.useNotebook ?? true,
    useSinging: settings?.useSinging ?? true,
    maxVersesPerLesson: settings?.maxVersesPerLesson ?? 3,
    weights: weightsJson,
  });

  const check = await tx.homeworkCheck.findUniqueOrThrow({
    where: { id: checkId },
    select: {
      present: true,
      testScore: true,
      notebookScore: true,
      singing: true,
      homeworkChecked: true,
      verseScores: { select: { score: true } },
    },
  });

  const verseScores = check.verseScores.map((row) => row.score);
  const pointsTotal = computePoints(
    lessonKind,
    {
      verseScores,
      testScore: check.testScore,
      notebookScore: check.notebookScore,
      singing: check.singing,
    },
    snapshot.weights,
    snapshot.switches,
  );

  const lessons = await tx.lesson.findMany({
    where: { gradeId, academicYearId },
    select: { id: true, lessonDate: true, createdAt: true },
  });
  const nextDate = nextLessonDate(
    lessons.map((row) => ({
      id: row.id,
      lessonDate: lessonDateToIso(row.lessonDate),
      createdAt: row.createdAt.toISOString(),
    })),
    lessonId,
  );
  const late = await computeLateForCheck(tx, checkId, nextDate, schoolTimeZone);

  const updated = await tx.homeworkCheck.update({
    where: { id: checkId },
    data: {
      homeworkChecked: true,
      pointsTotal,
      scoringSnapshot: snapshot,
      late,
      checkedById: actorUserId,
      checkedAt,
      present: input.present ?? check.present,
    },
    select: { id: true, updatedAt: true },
  });

  if (shouldWriteAudit) {
    await writeAudit(tx, {
      actorUserId,
      source: AUDIT_SOURCE.USER,
      entityType: AUDIT_ENTITY_TYPE.HOMEWORK_CHECK,
      entityId: checkId,
      action: AUDIT_ACTION.CHECK_SAVED,
      newValue: { lessonId: input.lessonId, pupilId: input.pupilId },
    });
  }

  return { ok: true, data: { checkId: updated.id, updatedAt: updated.updatedAt.toISOString() } };
}
