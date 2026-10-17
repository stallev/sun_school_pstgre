import { z } from "zod";
import { GRADE_EVENT_TYPE } from "../constants/enums";

const eventDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  error: "teacher.calendar.date_invalid",
});

const eventTitleSchema = z.string().trim().min(1, { error: "teacher.calendar.title_required" }).max(200);

const eventDescriptionSchema = z.string().trim().max(5_000).optional();

const eventTypeSchema = z.enum([
  GRADE_EVENT_TYPE.LESSON,
  GRADE_EVENT_TYPE.TRIP,
  GRADE_EVENT_TYPE.CANCELLATION,
]);

const lessonLinkRefine = (
  value: { type: (typeof GRADE_EVENT_TYPE)[keyof typeof GRADE_EVENT_TYPE]; lessonId?: string },
  ctx: z.RefinementCtx,
) => {
  if (value.type !== GRADE_EVENT_TYPE.LESSON && value.lessonId) {
    ctx.addIssue({
      code: "custom",
      message: "teacher.calendar.lesson_link_invalid",
      path: ["lessonId"],
    });
  }
};

export const createCalendarEventInputSchema = z
  .object({
    gradeId: z.uuid(),
    eventDate: eventDateSchema,
    type: eventTypeSchema,
    title: eventTitleSchema,
    description: eventDescriptionSchema,
    lessonId: z.uuid().optional(),
  })
  .strict()
  .superRefine(lessonLinkRefine);

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventInputSchema>;

export const updateCalendarEventInputSchema = z
  .object({
    eventId: z.uuid(),
    eventDate: eventDateSchema,
    type: eventTypeSchema,
    title: eventTitleSchema,
    description: eventDescriptionSchema,
    lessonId: z.uuid().optional(),
  })
  .strict()
  .superRefine(lessonLinkRefine);

export type UpdateCalendarEventInput = z.infer<typeof updateCalendarEventInputSchema>;

export const deleteCalendarEventInputSchema = z
  .object({
    eventId: z.uuid(),
  })
  .strict();

export type DeleteCalendarEventInput = z.infer<typeof deleteCalendarEventInputSchema>;
