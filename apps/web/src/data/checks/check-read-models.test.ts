import { afterEach, describe, expect, it, vi } from "vitest";
import { LESSON_KIND, LESSON_STATUS } from "@sunschool/domain";
import { previousRegularLesson, resolveVersesToRecite } from "@sunschool/domain";
import type { PrismaClient } from "@sunschool/db";
import { calendarDateFromIso } from "@/data/school/calendar-date";
import * as checkReadShared from "./check-read-shared.server";
import { loadCheckRosterRows, pickCurrentHeldLessonId } from "./check-read-shared.server";
import { getLessonProgress } from "./get-lesson-progress";

const lessonContext = {
  id: "lesson-1",
  gradeId: "grade-1",
  academicYearId: "year-1",
  lessonDate: new Date("2026-10-15T00:00:00.000Z"),
};

function pupilProfile(id: string, lastName: string, firstName: string) {
  return {
    id,
    firstName,
    lastName,
    middleName: null,
    birthDate: null,
  };
}

function homeworkCheckRow(
  pupilId: string,
  pupil: ReturnType<typeof pupilProfile>,
  homeworkChecked: boolean,
) {
  return {
    id: `check-${pupilId}`,
    pupilId,
    present: true,
    homeworkChecked,
    testScore: null,
    notebookScore: null,
    singing: false,
    late: false,
    pointsTotal: null,
    updatedAt: new Date("2026-10-15T10:00:00.000Z"),
    verseScores: [],
    pupil,
  };
}

function mockRosterDb(
  enrollments: { pupilId: string; pupil: ReturnType<typeof pupilProfile> }[],
  checks: ReturnType<typeof homeworkCheckRow>[],
) {
  const enrollmentFindMany = vi.fn().mockResolvedValue(enrollments);
  const homeworkCheckFindMany = vi.fn().mockResolvedValue(checks);
  const db = {
    enrollment: { findMany: enrollmentFindMany },
    homeworkCheck: { findMany: homeworkCheckFindMany },
  } as unknown as PrismaClient;
  return { db, enrollmentFindMany, homeworkCheckFindMany };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("pickCurrentHeldLessonId", () => {
  it("returns the nearest HELD lesson on or before today", () => {
    const lessons = [
      { id: "a", lessonDateIso: "2026-10-01", status: LESSON_STATUS.HELD },
      { id: "b", lessonDateIso: "2026-10-08", status: LESSON_STATUS.HELD },
      { id: "c", lessonDateIso: "2026-10-15", status: LESSON_STATUS.CHECK_COMPLETED },
    ];
    expect(pickCurrentHeldLessonId(lessons, "2026-10-10")).toBe("b");
  });

  it("returns null when no HELD lesson is on or before today", () => {
    const lessons = [
      { id: "future", lessonDateIso: "2026-10-20", status: LESSON_STATUS.HELD },
    ];
    expect(pickCurrentHeldLessonId(lessons, "2026-10-10")).toBeNull();
  });
});

describe("resolveVersesToRecite selection", () => {
  it("uses verses from the previous regular lesson (БП-2)", () => {
    const lessons = [
      {
        id: "regular-1",
        lessonDate: "2026-10-01",
        createdAt: "2026-10-01T08:00:00.000Z",
        kind: LESSON_KIND.REGULAR,
        verses: [{ lessonVerseId: "verse-1", position: 1 }],
      },
      {
        id: "review-1",
        lessonDate: "2026-10-08",
        createdAt: "2026-10-08T08:00:00.000Z",
        kind: LESSON_KIND.REVIEW,
        verses: [],
      },
      {
        id: "regular-2",
        lessonDate: "2026-10-15",
        createdAt: "2026-10-15T08:00:00.000Z",
        kind: LESSON_KIND.REGULAR,
        verses: [{ lessonVerseId: "verse-2", position: 1 }],
      },
    ];
    expect(previousRegularLesson(lessons, "regular-2")?.id).toBe("regular-1");
    expect(resolveVersesToRecite(lessons, "regular-2")).toEqual([
      { lessonVerseId: "verse-1", position: 1 },
    ]);
    expect(resolveVersesToRecite(lessons, "review-1")).toEqual([
      { lessonVerseId: "verse-1", position: 1 },
    ]);
  });
});

describe("loadCheckRosterRows", () => {
  it("includes pupils enrolled on the lesson date with addedLater false", async () => {
    const pupil = pupilProfile("pupil-enrolled", "Иванова", "Аня");
    const { db, enrollmentFindMany } = mockRosterDb(
      [{ pupilId: pupil.id, pupil }],
      [],
    );

    const roster = await loadCheckRosterRows(db, lessonContext);

    expect(enrollmentFindMany).toHaveBeenCalledWith({
      where: {
        gradeId: lessonContext.gradeId,
        academicYearId: lessonContext.academicYearId,
        startsOn: { lte: calendarDateFromIso("2026-10-15") },
        OR: [{ endsOn: null }, { endsOn: { gte: calendarDateFromIso("2026-10-15") } }],
      },
      select: {
        pupilId: true,
        pupil: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            birthDate: true,
          },
        },
      },
    });
    expect(roster).toHaveLength(1);
    expect(roster[0]?.pupilId).toBe(pupil.id);
    expect(roster[0]?.addedLater).toBe(false);
  });

  it("marks pupils with a check but no enrollment as addedLater", async () => {
    const enrolled = pupilProfile("pupil-enrolled", "Иванова", "Аня");
    const addedLater = pupilProfile("pupil-later", "Петров", "Борис");
    const { db } = mockRosterDb(
      [{ pupilId: enrolled.id, pupil: enrolled }],
      [homeworkCheckRow(addedLater.id, addedLater, true)],
    );

    const roster = await loadCheckRosterRows(db, lessonContext);
    const laterRow = roster.find((row) => row.pupilId === addedLater.id);

    expect(laterRow?.addedLater).toBe(true);
    expect(laterRow?.homeworkChecked).toBe(true);
    expect(roster.find((row) => row.pupilId === enrolled.id)?.addedLater).toBe(false);
  });
});

describe("getLessonProgress", () => {
  it("returns checkedCount and totalCount as N of M from the roster", async () => {
    const lessonId = lessonContext.id;
    vi.spyOn(checkReadShared, "loadCheckLessonAccess").mockResolvedValue({
      kind: "ok",
      organizationId: "org-1",
      lesson: {
        ...lessonContext,
        kind: LESSON_KIND.REGULAR,
        status: LESSON_STATUS.HELD,
        hasTest: false,
        title: "Урок",
        ordinal: 1,
      },
      canMutate: true,
      yearClosed: false,
    });
    vi.spyOn(checkReadShared, "loadCheckRosterRows").mockResolvedValue([
      {
        pupilId: "a",
        displayName: "А",
        birthYear: null,
        addedLater: false,
        checkId: "c1",
        present: true,
        homeworkChecked: true,
        testScore: null,
        notebookScore: null,
        singing: false,
        late: false,
        pointsTotal: 10,
        updatedAt: null,
        verseScores: [],
      },
      {
        pupilId: "b",
        displayName: "Б",
        birthYear: null,
        addedLater: false,
        checkId: null,
        present: false,
        homeworkChecked: false,
        testScore: null,
        notebookScore: null,
        singing: false,
        late: false,
        pointsTotal: null,
        updatedAt: null,
        verseScores: [],
      },
      {
        pupilId: "c",
        displayName: "В",
        birthYear: null,
        addedLater: true,
        checkId: "c3",
        present: true,
        homeworkChecked: true,
        testScore: null,
        notebookScore: null,
        singing: false,
        late: false,
        pointsTotal: 8,
        updatedAt: null,
        verseScores: [],
      },
    ]);

    const progress = await getLessonProgress({} as PrismaClient, "teacher-1", lessonId);

    expect(progress).toEqual({
      kind: "progress",
      lessonId,
      lessonStatus: LESSON_STATUS.HELD,
      checkedCount: 2,
      totalCount: 3,
    });
  });
});
