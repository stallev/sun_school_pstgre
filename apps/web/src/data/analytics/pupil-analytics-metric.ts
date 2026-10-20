import { z } from "zod";

export const PUPIL_YEAR_METRICS = ["attendance", "verses", "test", "notebook"] as const;

export type PupilYearMetric = (typeof PUPIL_YEAR_METRICS)[number];

export const pupilYearMetricSchema = z
  .enum(PUPIL_YEAR_METRICS)
  .optional()
  .transform((value) => value ?? "attendance");
