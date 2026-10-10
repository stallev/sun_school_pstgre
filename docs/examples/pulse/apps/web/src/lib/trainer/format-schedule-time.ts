export const DEFAULT_SCHEDULE_START_TIME = "09:00";
export const DEFAULT_SCHEDULE_END_TIME = "13:00";

export function formatScheduleTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function isValidScheduleTime(value: string): boolean {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    return false;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export function normalizeScheduleTimeInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const digits = trimmed.replace(/\D/g, "").slice(0, 4);
  if (digits.length === 0) {
    return "";
  }

  const hours = Math.min(23, Math.max(0, Number(digits.slice(0, 2)) || 0));
  const minutes = Math.min(59, Math.max(0, Number(digits.slice(2, 4)) || 0));
  return formatScheduleTime(hours, minutes);
}

export function scheduleTimeToMinutes(value: string): number | null {
  if (!isValidScheduleTime(value)) {
    return null;
  }

  const [hours, minutes] = value.split(":").map(Number);
  return hours! * 60 + minutes!;
}

export function isScheduleIntervalValid(startTime: string, endTime: string): boolean {
  const startTotal = scheduleTimeToMinutes(startTime);
  const endTotal = scheduleTimeToMinutes(endTime);
  if (startTotal === null || endTotal === null) {
    return false;
  }

  return endTotal > startTotal;
}
