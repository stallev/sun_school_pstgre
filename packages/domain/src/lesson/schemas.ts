import { z } from "zod";
import { LESSON_KIND } from "../constants/enums";

const verseRangeSchema = z
  .object({
    bookId: z.uuid(),
    startChapter: z.number().int().min(1),
    startVerse: z.number().int().min(1),
    endChapter: z.number().int().min(1),
    endVerse: z.number().int().min(1),
  })
  .strict();

const lessonTitleSchema = z.string().trim().min(1, { error: "teacher.lesson.title_required" }).max(200);

const lessonDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  error: "teacher.lesson.date_invalid",
});

const lessonBodySchema = z.string().trim().max(50_000).optional();

const versesSchema = z.array(verseRangeSchema);

const reviewLessonRefine = (
  value: { kind: typeof LESSON_KIND.REGULAR | typeof LESSON_KIND.REVIEW; hasTest: boolean; verses: unknown[] },
  ctx: z.RefinementCtx,
) => {
  if (value.kind === LESSON_KIND.REVIEW) {
    if (value.hasTest) {
      ctx.addIssue({
        code: "custom",
        message: "teacher.lesson.review_no_verses",
        path: ["hasTest"],
      });
    }
    if (value.verses.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: "teacher.lesson.review_no_verses",
        path: ["verses"],
      });
    }
  }
};

export const createLessonInputSchema = z
  .object({
    gradeId: z.uuid(),
    title: lessonTitleSchema,
    lessonDate: lessonDateSchema,
    kind: z.enum([LESSON_KIND.REGULAR, LESSON_KIND.REVIEW]),
    leadTeacherId: z.uuid(),
    body: lessonBodySchema,
    hasTest: z.boolean(),
    verses: versesSchema,
  })
  .strict()
  .superRefine(reviewLessonRefine);

export type CreateLessonInput = z.infer<typeof createLessonInputSchema>;

export const updateLessonInputSchema = z
  .object({
    lessonId: z.uuid(),
    title: lessonTitleSchema,
    lessonDate: lessonDateSchema,
    kind: z.enum([LESSON_KIND.REGULAR, LESSON_KIND.REVIEW]),
    leadTeacherId: z.uuid(),
    body: lessonBodySchema,
    hasTest: z.boolean(),
    verses: versesSchema,
  })
  .strict()
  .superRefine(reviewLessonRefine);

export type UpdateLessonInput = z.infer<typeof updateLessonInputSchema>;

export const changeLeadTeacherInputSchema = z
  .object({
    lessonId: z.uuid(),
    leadTeacherId: z.uuid(),
  })
  .strict();

export type ChangeLeadTeacherInput = z.infer<typeof changeLeadTeacherInputSchema>;

export const deleteLessonInputSchema = z
  .object({
    lessonId: z.uuid(),
  })
  .strict();

export type DeleteLessonInput = z.infer<typeof deleteLessonInputSchema>;

/** homework_check_contract §8 — verse count per lesson. */
export const validateLessonVerseLimit = (
  verseCount: number,
  maxVersesPerLesson: number,
): boolean => verseCount <= maxVersesPerLesson;
