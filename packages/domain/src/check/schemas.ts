import { z } from "zod";
import { LESSON_KIND } from "../constants/enums";

const score0to10Schema = z.number().int().min(0).max(10);
const nullableScore0to10Schema = score0to10Schema.nullable();
const verseScoreSchema = z.number().int().min(0).max(2).nullable();

export const verseScoreInputSchema = z
  .object({
    lessonVerseId: z.uuid(),
    score: verseScoreSchema,
  })
  .strict();

export type VerseScoreInput = z.infer<typeof verseScoreInputSchema>;

const checkCommentSchema = z.string().trim().max(500).optional();

const lessonKindSchema = z.enum([LESSON_KIND.REGULAR, LESSON_KIND.REVIEW]);

const reviewCheckRefine = (
  value: {
    lessonKind: typeof LESSON_KIND.REGULAR | typeof LESSON_KIND.REVIEW;
    testScore?: number | null | undefined;
    verseScores?: VerseScoreInput[] | undefined;
  },
  ctx: z.RefinementCtx,
) => {
  if (value.lessonKind !== LESSON_KIND.REVIEW) {
    return;
  }
  if (value.testScore !== undefined && value.testScore !== null) {
    ctx.addIssue({
      code: "custom",
      message: "teacher.lesson.review_no_verses",
      path: ["testScore"],
    });
  }
  if (value.verseScores !== undefined && value.verseScores.length > 0) {
    ctx.addIssue({
      code: "custom",
      message: "teacher.lesson.review_no_verses",
      path: ["verseScores"],
    });
  }
};

const expectedUpdatedAtSchema = z.string().datetime({ offset: true }).optional();

/** homework_check_contract §4.2 — partial save. */
export const savePartialCheckInputSchema = z
  .object({
    lessonId: z.uuid(),
    pupilId: z.uuid(),
    lessonKind: lessonKindSchema,
    present: z.boolean().optional(),
    testScore: nullableScore0to10Schema.optional(),
    notebookScore: nullableScore0to10Schema.optional(),
    verseScores: z.array(verseScoreInputSchema).optional(),
    singing: z.boolean().optional(),
    comment: checkCommentSchema,
    expectedUpdatedAt: expectedUpdatedAtSchema,
  })
  .strict()
  .superRefine(reviewCheckRefine);

export type SavePartialCheckInput = z.infer<typeof savePartialCheckInputSchema>;

/** homework_check_contract §4.2, §5.5 — final save requires presence. */
export const saveCheckedInputSchema = z
  .object({
    lessonId: z.uuid(),
    pupilId: z.uuid(),
    lessonKind: lessonKindSchema,
    present: z.boolean(),
    testScore: nullableScore0to10Schema.optional(),
    notebookScore: nullableScore0to10Schema.optional(),
    verseScores: z.array(verseScoreInputSchema).optional(),
    singing: z.boolean().optional(),
    comment: checkCommentSchema,
    expectedUpdatedAt: expectedUpdatedAtSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    reviewCheckRefine(value, ctx);
    if (!value.present) {
      ctx.addIssue({
        code: "custom",
        message: "teacher.check.present_required",
        path: ["present"],
      });
    }
  });

export type SaveCheckedInput = z.infer<typeof saveCheckedInputSchema>;

export const correctCheckInputSchema = z
  .object({
    lessonId: z.uuid(),
    pupilId: z.uuid(),
    lessonKind: lessonKindSchema,
    present: z.boolean().optional(),
    testScore: nullableScore0to10Schema.optional(),
    notebookScore: nullableScore0to10Schema.optional(),
    verseScores: z.array(verseScoreInputSchema).optional(),
    singing: z.boolean().optional(),
    comment: checkCommentSchema,
    expectedUpdatedAt: expectedUpdatedAtSchema,
    reason: z.string().trim().min(1).max(500).optional(),
  })
  .strict()
  .superRefine(reviewCheckRefine);

export type CorrectCheckInput = z.infer<typeof correctCheckInputSchema>;

export const overrideVerseScoreInputSchema = z
  .object({
    lessonId: z.uuid(),
    pupilId: z.uuid(),
    lessonVerseId: z.uuid(),
    score: verseScoreSchema,
    expectedUpdatedAt: expectedUpdatedAtSchema,
  })
  .strict();

export type OverrideVerseScoreInput = z.infer<typeof overrideVerseScoreInputSchema>;

/** homework_check_contract §5.8 — complete lesson check session. */
export const completeLessonCheckInputSchema = z
  .object({
    lessonId: z.uuid(),
  })
  .strict();

export type CompleteLessonCheckInput = z.infer<typeof completeLessonCheckInputSchema>;
