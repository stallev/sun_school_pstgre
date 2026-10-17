/** БП-1 — порог явки для основной выборки (слой A). */
export const ATTENDANCE_SAMPLE_THRESHOLD = 0.5;

export type PupilLessonAttendanceRow = {
  lessonDate: string;
  isCheckedLesson: boolean;
  hasPupilRecord: boolean;
  present: boolean;
  onOrAfterCountingStart: boolean;
};

export type AttendanceCounts = {
  presentCount: number;
  checkedWithRecordCount: number;
  rate: number | null;
};

/** Явка: присутствовал из проверенных уроков с записью после даты отсчёта (БП-1). */
export const computeAttendanceCounts = (
  rows: readonly PupilLessonAttendanceRow[],
): AttendanceCounts => {
  let presentCount = 0;
  let checkedWithRecordCount = 0;

  for (const row of rows) {
    if (!row.onOrAfterCountingStart || !row.isCheckedLesson || !row.hasPupilRecord) {
      continue;
    }
    checkedWithRecordCount += 1;
    if (row.present) {
      presentCount += 1;
    }
  }

  if (checkedWithRecordCount === 0) {
    return { presentCount, checkedWithRecordCount, rate: null };
  }

  return {
    presentCount,
    checkedWithRecordCount,
    rate: presentCount / checkedWithRecordCount,
  };
};
