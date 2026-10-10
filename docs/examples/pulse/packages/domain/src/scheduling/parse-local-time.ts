const TIME_PATTERN = /^(\d{1,2}):(\d{2})$/;

export function parseLocalTimeToMinutes(value: string): number | null {
  const match = TIME_PATTERN.exec(value.trim());
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    return null;
  }

  return hour * 60 + minute;
}
