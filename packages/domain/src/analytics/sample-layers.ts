import { ATTENDANCE_SAMPLE_THRESHOLD, type AttendanceCounts } from "./attendance";

export const SAMPLE_LAYER = {
  A: "A",
  B: "B",
  C: "C",
  D: "D",
} as const;

export type SampleLayer = (typeof SAMPLE_LAYER)[keyof typeof SAMPLE_LAYER];

/**
 * БП-1 — дата отсчёта: зачисление; для перенесённых данных — более ранняя из зачисления
 * и даты самого раннего проверенного урока с записью ученика.
 */
export const resolveSampleCountingStartDate = (
  enrollmentStartsOn: string | null,
  earliestCheckedLessonDateWithRecord: string | null,
): string | null => {
  if (!enrollmentStartsOn && !earliestCheckedLessonDateWithRecord) {
    return null;
  }
  if (!enrollmentStartsOn) {
    return earliestCheckedLessonDateWithRecord;
  }
  if (!earliestCheckedLessonDateWithRecord) {
    return enrollmentStartsOn;
  }
  return enrollmentStartsOn <= earliestCheckedLessonDateWithRecord
    ? enrollmentStartsOn
    : earliestCheckedLessonDateWithRecord;
};

export type ClassifySampleLayerInput = {
  pupilIsActive: boolean;
  countingStartDate: string | null;
  attendance: AttendanceCounts;
  hasCheckedLessonAfterCountingStart: boolean;
};

/** Слои A/B/C/D по БП-1. */
export const classifySampleLayer = (input: ClassifySampleLayerInput): SampleLayer => {
  if (!input.pupilIsActive) {
    return SAMPLE_LAYER.C;
  }
  if (!input.countingStartDate || !input.hasCheckedLessonAfterCountingStart) {
    return SAMPLE_LAYER.D;
  }
  if (input.attendance.rate === null) {
    return SAMPLE_LAYER.D;
  }
  if (input.attendance.rate < ATTENDANCE_SAMPLE_THRESHOLD) {
    return SAMPLE_LAYER.B;
  }
  return SAMPLE_LAYER.A;
};

export const isMainSampleLayer = (layer: SampleLayer): boolean => layer === SAMPLE_LAYER.A;
