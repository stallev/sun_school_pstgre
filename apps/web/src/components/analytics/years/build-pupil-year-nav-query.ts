const PERIOD_QUERY_KEYS = ["month", "from", "to", "gradeId"] as const;

export function buildPupilYearNavSearchParams(
  current: URLSearchParams,
  updates: Record<string, string>,
  resetPeriod: boolean,
): URLSearchParams {
  const params = new URLSearchParams(current.toString());
  if (resetPeriod) {
    for (const key of PERIOD_QUERY_KEYS) {
      params.delete(key);
    }
  }
  for (const [key, value] of Object.entries(updates)) {
    params.set(key, value);
  }
  return params;
}
