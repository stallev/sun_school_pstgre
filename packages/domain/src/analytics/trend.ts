/** Спец. 9.1.3 — тренд по последним урокам. */
export const TREND_LESSON_WINDOW = 6;
export const TREND_MIN_POINTS = 4;
export const TREND_SLOPE_GROWING_THRESHOLD_PP = 1;
export const TREND_SLOPE_DECLINING_THRESHOLD_PP = -1;

export const TREND_LABEL = {
  INSUFFICIENT_DATA: "INSUFFICIENT_DATA",
  GROWING: "GROWING",
  DECLINING: "DECLINING",
  STABLE: "STABLE",
} as const;

export type TrendLabel = (typeof TREND_LABEL)[keyof typeof TREND_LABEL];

export type TrendResult = {
  label: TrendLabel;
  slopePpPerLesson: number | null;
  pointCount: number;
};

/** Наклон МНК: y по индексам 0..n-1, единица — урок (п.п. за урок для нормированных %). */
export const leastSquaresSlope = (values: readonly number[]): number => {
  const n = values.length;
  if (n < 2) {
    return 0;
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let index = 0; index < n; index += 1) {
    const x = index;
    const y = values[index] ?? 0;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) {
    return 0;
  }
  return (n * sumXY - sumX * sumY) / denominator;
};

export const classifyTrendSlope = (slopePpPerLesson: number): TrendLabel => {
  if (slopePpPerLesson > TREND_SLOPE_GROWING_THRESHOLD_PP) {
    return TREND_LABEL.GROWING;
  }
  if (slopePpPerLesson < TREND_SLOPE_DECLINING_THRESHOLD_PP) {
    return TREND_LABEL.DECLINING;
  }
  return TREND_LABEL.STABLE;
};

export const computeTrend = (
  normalizedPercents: readonly number[],
  windowSize: number = TREND_LESSON_WINDOW,
): TrendResult => {
  const window =
    normalizedPercents.length > windowSize
      ? normalizedPercents.slice(-windowSize)
      : normalizedPercents;

  if (window.length < TREND_MIN_POINTS) {
    return {
      label: TREND_LABEL.INSUFFICIENT_DATA,
      slopePpPerLesson: null,
      pointCount: window.length,
    };
  }

  const slope = leastSquaresSlope(window);
  return {
    label: classifyTrendSlope(slope),
    slopePpPerLesson: slope,
    pointCount: window.length,
  };
};
