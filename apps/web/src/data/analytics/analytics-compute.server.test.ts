import { describe, expect, it, vi } from "vitest";
import { LESSON_KIND } from "@sunschool/domain";
import { computeGroupAnalyticsSnapshot } from "./analytics-compute.server";
import { computeGroupYearSnapshotMetrics } from "./years/compute-year-snapshots.server";

const gradeId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const yearId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const excludedPupilId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const otherPupilId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const lessonId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

const lessonDate = new Date(Date.UTC(2025, 10, 15));
const yearStart = new Date(Date.UTC(2025, 8, 1));
const yearEnd = new Date(Date.UTC(2026, 5, 30));

const period = {
  academicYearId: yearId,
  fromIso: "2025-09-01",
  toIso: "2026-06-30",
};

function buildDb() {
  return {
    enrollment: {
      findMany: vi.fn().mockResolvedValue([
        {
          pupilId: excludedPupilId,
          startsOn: yearStart,
          pupil: {
            id: excludedPupilId,
            firstName: "Excluded",
            lastName: "Child",
            middleName: null,
            birthDate: null,
            isActive: true,
          },
        },
        {
          pupilId: otherPupilId,
          startsOn: yearStart,
          pupil: {
            id: otherPupilId,
            firstName: "Other",
            lastName: "Pupil",
            middleName: null,
            birthDate: null,
            isActive: true,
          },
        },
      ]),
    },
    lesson: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: lessonId,
          lessonDate,
          kind: LESSON_KIND.REGULAR,
          hasTest: false,
          ordinal: 1,
          createdAt: new Date(Date.UTC(2025, 10, 15, 8)),
        },
      ]),
      count: vi.fn().mockResolvedValue(0),
    },
    homeworkCheck: {
      findMany: vi.fn().mockResolvedValue([
        {
          lessonId,
          pupilId: excludedPupilId,
          present: true,
          homeworkChecked: true,
          late: false,
          testScore: null,
          notebookScore: 8,
          verseScores: [],
        },
      ]),
    },
    academicYear: {
      findUniqueOrThrow: vi.fn().mockResolvedValue({ startsOn: yearStart, endsOn: yearEnd }),
    },
  };
}

describe("computeGroupAnalyticsSnapshot excludePupilId (§6.3)", () => {
  it("does not treat a lesson as checked when only the excluded pupil submitted homework", async () => {
    const db = buildDb();

    const snapshot = await computeGroupAnalyticsSnapshot(db as never, gradeId, period, {
      excludePupilId: excludedPupilId,
    });

    expect(snapshot.hasCheckedLessonsInPeriod).toBe(false);
    expect(snapshot.charts.attendance).toHaveLength(0);
    const remaining = snapshot.pupilsByLayer.A.concat(
      snapshot.pupilsByLayer.B,
      snapshot.pupilsByLayer.C,
      snapshot.pupilsByLayer.D,
    );
    expect(remaining.some((row) => row.pupilId === excludedPupilId)).toBe(false);
    expect(remaining.find((row) => row.pupilId === otherPupilId)?.checkedLessonCount).toBe(0);
  });
});

describe("computeGroupYearSnapshotMetrics excludePupilId (§6.3)", () => {
  it("counts zero checked lessons when only the excluded pupil had checks", async () => {
    const db = buildDb();

    const totals = await computeGroupYearSnapshotMetrics(db as never, gradeId, yearId, {
      excludePupilId: excludedPupilId,
    });

    expect(db.lesson.count).toHaveBeenCalledWith({
      where: {
        gradeId,
        academicYearId: yearId,
        checks: {
          some: {
            homeworkChecked: true,
            pupilId: { not: excludedPupilId },
          },
        },
      },
    });
    expect(totals.lessons).toBe(0);
  });
});
