import { z } from "zod";

const localTimeSchema = z
  .string()
  .regex(/^\d{1,2}:\d{2}$/, "Expected HH:mm");

export const weeklyIntervalInputSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: localTimeSchema,
  endTime: localTimeSchema,
});

export const saveWeeklyScheduleInputSchema = z.object({
  intervals: z.array(weeklyIntervalInputSchema),
});

export type SaveWeeklyScheduleInput = z.infer<
  typeof saveWeeklyScheduleInputSchema
>;
