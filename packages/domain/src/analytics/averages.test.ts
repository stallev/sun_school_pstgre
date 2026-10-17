import { describe, expect, it } from "vitest";
import { LESSON_KIND } from "../constants/enums";
import {
  averageRecitedVersesForLesson,
  collectReportAverageScores,
  countRecitedVerses,
  findFirstRegularLessonId,
  isVerseRecitationAnalyticsLesson,
  scoreCountsTowardReportAverage,
} from "./averages";

describe("scoreCountsTowardReportAverage", () => {
  it.each([
    { present: true, late: false, score: 8, counts: true },
    { present: false, late: true, score: 0, counts: true },
    { present: false, late: false, score: 10, counts: false },
    { present: true, late: false, score: null, counts: false },
  ])("present=$present late=$late score=$score → $counts", ({ present, late, score, counts }) => {
    expect(scoreCountsTowardReportAverage(present, late, score)).toBe(counts);
  });
});

describe("collectReportAverageScores", () => {
  it("NULL excluded, 0 included (INV-11)", () => {
    const result = collectReportAverageScores([
      { present: true, submittedLate: false, score: null },
      { present: true, submittedLate: false, score: 0 },
      { present: true, submittedLate: false, score: 10 },
    ]);
    expect(result.observationCount).toBe(2);
    expect(result.average).toBe(5);
  });
});

const lessons = [
  {
    id: "regular-1",
    kind: LESSON_KIND.REGULAR,
    lessonDate: "2026-09-01",
    createdAt: "2026-08-01T10:00:00.000Z",
  },
  {
    id: "review",
    kind: LESSON_KIND.REVIEW,
    lessonDate: "2026-09-08",
    createdAt: "2026-08-01T11:00:00.000Z",
  },
  {
    id: "regular-2",
    kind: LESSON_KIND.REGULAR,
    lessonDate: "2026-09-15",
    createdAt: "2026-08-01T12:00:00.000Z",
  },
];

describe("verse analytics lessons (БП-2)", () => {
  const firstRegularLesson = lessons[0]!;
  const reviewLesson = lessons[1]!;
  const secondRegularLesson = lessons[2]!;
  const firstRegularId = findFirstRegularLessonId(lessons);

  it("skips first regular and review lessons", () => {
    expect(firstRegularId).toBe("regular-1");
    expect(isVerseRecitationAnalyticsLesson(firstRegularLesson, firstRegularId)).toBe(false);
    expect(isVerseRecitationAnalyticsLesson(reviewLesson, firstRegularId)).toBe(false);
    expect(isVerseRecitationAnalyticsLesson(secondRegularLesson, firstRegularId)).toBe(true);
  });

  it("counts recited verses and averages per lesson", () => {
    expect(countRecitedVerses([2, 0, 1, null])).toBe(2);
    const average = averageRecitedVersesForLesson([
      { lessonId: "regular-2", present: true, verseScores: [2, 1] },
      { lessonId: "regular-2", present: false, verseScores: [2, 2] },
      { lessonId: "regular-2", present: true, verseScores: [0, 0] },
    ]);
    expect(average.observationCount).toBe(2);
    expect(average.average).toBe(1);
  });
});
