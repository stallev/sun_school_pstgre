/**
 * Рейтинг (Q-01, спец. 12.2 п. 5): сумма баллов уроков за год по проверенным записям.
 * Достижения и штрафы не входят (РТ-3).
 */
export const computeRatingMetric = (checkedLessonPoints: readonly number[]): number =>
  checkedLessonPoints.reduce((sum, points) => sum + points, 0);

export type RatingRow = {
  pupilId: string;
  metric: number;
};

/** Сортировка по убыванию метрики; при равенстве — стабильно по pupilId. */
export const compareRatingRows = (left: RatingRow, right: RatingRow): number => {
  if (right.metric !== left.metric) {
    return right.metric - left.metric;
  }
  return left.pupilId.localeCompare(right.pupilId);
};

export const rankRatingRows = (rows: readonly RatingRow[]): RatingRow[] =>
  [...rows].sort(compareRatingRows);
