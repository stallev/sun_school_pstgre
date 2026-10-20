import { ACADEMIC_YEAR_STATUS } from "@sunschool/domain";
import type { PupilYearRow } from "@/data/analytics/years/list-pupil-year-rows";
import type { PupilYearTableRow } from "./PupilYearsSection";

export const buildPupilYearTableRows = (rows: readonly PupilYearRow[]): PupilYearTableRow[] =>
  rows.map((row) => ({
    yearId: row.yearId,
    yearName: row.yearName,
    isActive: row.status === ACADEMIC_YEAR_STATUS.ACTIVE,
    gradeLabels: row.gradeLabels,
    lessons: row.totals?.lessons ?? 0,
    attendance: row.totals?.attendance ?? null,
    verses: row.totals?.verses ?? null,
    test: row.totals?.test ?? null,
    notebook: row.totals?.notebook ?? null,
    bricksEarned: row.totals?.bricksEarned ?? 0,
    bricksIssued: row.bricksIssued,
    insufficientLessons: row.insufficientLessons,
  }));
