import "server-only";
import {
  ACHIEVEMENT_FACT_STATE,
  ACHIEVEMENT_METRIC,
  LESSON_KIND,
  type AchievementFactState,
  type LessonKind,
} from "@sunschool/domain";

export type AchievementCheckFactRow = {
  checkId: string;
  lessonKind: LessonKind;
  lessonHasTest: boolean;
  lessonInOffPeriod: boolean;
  homeworkChecked: boolean;
  testScore: number | null;
  notebookScore: number | null;
  singing: boolean;
  verseScores: readonly number[];
  lessonPoints: number | null;
};

function metricState(
  metric: string,
  row: AchievementCheckFactRow,
): { state: AchievementFactState; lessonPoints?: number } {
  if (!row.homeworkChecked || row.lessonInOffPeriod) {
    return { state: ACHIEVEMENT_FACT_STATE.SKIP };
  }

  const isReview = row.lessonKind === LESSON_KIND.REVIEW;
  const hasVerses = row.verseScores.length > 0;

  switch (metric) {
    case "verses_all_perfect":
      if (isReview || !hasVerses) return { state: ACHIEVEMENT_FACT_STATE.SKIP };
      return row.verseScores.every((score) => score === 2)
        ? { state: ACHIEVEMENT_FACT_STATE.CREDITED }
        : { state: ACHIEVEMENT_FACT_STATE.NOT_CREDITED };
    case "notebook_score_gte_9":
      if (row.notebookScore === null) return { state: ACHIEVEMENT_FACT_STATE.SKIP };
      return row.notebookScore >= 9
        ? { state: ACHIEVEMENT_FACT_STATE.CREDITED }
        : { state: ACHIEVEMENT_FACT_STATE.NOT_CREDITED };
    case "test_score_gte_8":
      if (isReview || !row.lessonHasTest || row.testScore === null) {
        return { state: ACHIEVEMENT_FACT_STATE.SKIP };
      }
      return row.testScore >= 8
        ? { state: ACHIEVEMENT_FACT_STATE.CREDITED }
        : { state: ACHIEVEMENT_FACT_STATE.NOT_CREDITED };
    case "lesson_homework_done":
      if (row.notebookScore !== null || hasVerses || row.testScore !== null) {
        return { state: ACHIEVEMENT_FACT_STATE.CREDITED };
      }
      return { state: ACHIEVEMENT_FACT_STATE.SKIP };
    case "verse_perfect":
      return hasVerses && row.verseScores.some((score) => score === 2)
        ? { state: ACHIEVEMENT_FACT_STATE.CREDITED }
        : { state: ACHIEVEMENT_FACT_STATE.SKIP };
    case "choir_attended":
      return row.singing ? { state: ACHIEVEMENT_FACT_STATE.CREDITED } : { state: ACHIEVEMENT_FACT_STATE.SKIP };
    case ACHIEVEMENT_METRIC.LESSON_POINTS_SUM: {
      const points = row.lessonPoints ?? 0;
      return points > 0
        ? { state: ACHIEVEMENT_FACT_STATE.CREDITED, lessonPoints: points }
        : { state: ACHIEVEMENT_FACT_STATE.SKIP };
    }
    default:
      return { state: ACHIEVEMENT_FACT_STATE.SKIP };
  }
}

export function buildAchievementEvaluateFacts(
  rows: readonly AchievementCheckFactRow[],
  metrics: readonly string[],
): Map<string, { factId: string; state: AchievementFactState; lessonPoints?: number }[]> {
  const uniqueMetrics = [...new Set(metrics.filter(Boolean))];
  const byMetric = new Map<string, { factId: string; state: AchievementFactState; lessonPoints?: number }[]>();
  for (const metric of uniqueMetrics) {
    byMetric.set(
      metric,
      rows.map((row) => {
        const scored = metricState(metric, row);
        return {
          factId: row.checkId,
          state: scored.state,
          lessonPoints: scored.lessonPoints,
        };
      }),
    );
  }
  return byMetric;
}
