import { z } from "zod";

export const scheduleExceptionInputSchema = z.object({
  exceptionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isBlocked: z.boolean(),
  reason: z.string().max(500).optional(),
});

export const deleteScheduleExceptionInputSchema = z.object({
  exceptionId: z.string().uuid(),
});

export type ScheduleExceptionInput = z.infer<typeof scheduleExceptionInputSchema>;
export type DeleteScheduleExceptionInput = z.infer<
  typeof deleteScheduleExceptionInputSchema
>;
