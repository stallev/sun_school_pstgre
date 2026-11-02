import {
  computePoints,
  type LessonKind,
  type LessonVerseToRecite,
  type ScoringSnapshot,
} from "@sunschool/domain";
import type { LessonTablePupilRow } from "@/data/checks/load-lesson-table-page.server";

export const rowHasEnteredScores = (
  row: LessonTablePupilRow,
  versesToRecite: readonly LessonVerseToRecite[],
): boolean => {
  if (row.singing) return true;
  if (row.testScore !== null) return true;
  if (row.notebookScore !== null) return true;
  return versesToRecite.some((verse) => row.verseScores[verse.lessonVerseId] !== null);
};

export const formatLessonCheckRowTotal = (
  row: LessonTablePupilRow,
  lessonKind: LessonKind,
  versesToRecite: readonly LessonVerseToRecite[],
  scoring: ScoringSnapshot,
): string | number => {
  if (row.homeworkChecked && row.pointsTotal !== null) {
    return row.pointsTotal;
  }
  if (!rowHasEnteredScores(row, versesToRecite)) {
    return "—";
  }
  const verseScores = versesToRecite.map((verse) => row.verseScores[verse.lessonVerseId] ?? null);
  return computePoints(
    lessonKind,
    {
      verseScores,
      testScore: row.testScore,
      notebookScore: row.notebookScore,
      singing: row.singing,
    },
    scoring.weights,
    scoring.switches,
  );
};
