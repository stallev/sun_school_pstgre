/** Спец. 9.1.3 — окно сглаживания по урокам. */
export const SMOOTHING_WINDOW_SIZE = 3;

export const movingAverage = (
  values: readonly number[],
  windowSize: number = SMOOTHING_WINDOW_SIZE,
): readonly number[] => {
  if (windowSize < 1) {
    return [];
  }

  const result: number[] = [];
  for (let index = 0; index < values.length; index += 1) {
    const start = Math.max(0, index - windowSize + 1);
    const slice = values.slice(start, index + 1);
    const sum = slice.reduce((total, value) => total + value, 0);
    result.push(sum / slice.length);
  }
  return result;
};

/** Разность соседних сглаженных значений, п.п. (9.1.3). */
export const successiveDifferences = (smoothed: readonly number[]): readonly number[] => {
  if (smoothed.length < 2) {
    return [];
  }
  const deltas: number[] = [];
  for (let index = 1; index < smoothed.length; index += 1) {
    const previous = smoothed[index - 1];
    const current = smoothed[index];
    if (previous === undefined || current === undefined) {
      continue;
    }
    deltas.push(current - previous);
  }
  return deltas;
};
