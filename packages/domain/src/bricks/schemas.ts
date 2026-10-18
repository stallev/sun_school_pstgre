import { z } from "zod";

const bricksNoteSchema = z.string().trim().max(300);

const issuedOnDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  error: "teacher.bricks.date_invalid",
});

const positiveBrickQuantitySchema = z
  .number({ error: "teacher.bricks.quantity_integer" })
  .int({ error: "teacher.bricks.quantity_integer" })
  .positive({ error: "teacher.bricks.quantity_nonzero" });

const negativeBrickQuantitySchema = z
  .number({ error: "teacher.bricks.quantity_integer" })
  .int({ error: "teacher.bricks.quantity_integer" })
  .negative({ error: "teacher.bricks.quantity_nonzero" });

const futureIssuedOnRefine = (today: string) => (value: { issuedOn?: string }, ctx: z.RefinementCtx) => {
  if (!value.issuedOn) {
    return;
  }
  if (value.issuedOn > today) {
    ctx.addIssue({
      code: "custom",
      message: "teacher.bricks.date_future",
      path: ["issuedOn"],
    });
  }
};

/** bricks_ledger_contract §5 — `issueBricks` input (server parses; no `issuedBy` / balance). */
export const issueBricksInputSchema = z
  .object({
    pupilId: z.uuid(),
    yearId: z.uuid(),
    quantity: positiveBrickQuantitySchema,
    issuedOn: issuedOnDateSchema.optional(),
    note: bricksNoteSchema.optional(),
    requestId: z.uuid().optional(),
  })
  .strict();

export type IssueBricksInput = z.infer<typeof issueBricksInputSchema>;

export const parseIssueBricksInput = (raw: unknown, today: string) =>
  issueBricksInputSchema.superRefine(futureIssuedOnRefine(today)).safeParse(raw);

/** bricks_ledger_contract §5 — `compensateBricks` input. */
export const compensateBricksInputSchema = z
  .object({
    pupilId: z.uuid(),
    yearId: z.uuid(),
    quantity: negativeBrickQuantitySchema,
    note: bricksNoteSchema.min(1, { error: "teacher.bricks.note_required" }),
    compensatesId: z.uuid().optional(),
    issuedOn: issuedOnDateSchema.optional(),
    requestId: z.uuid().optional(),
  })
  .strict();

export type CompensateBricksInput = z.infer<typeof compensateBricksInputSchema>;

export const parseCompensateBricksInput = (raw: unknown, today: string) =>
  compensateBricksInputSchema.superRefine(futureIssuedOnRefine(today)).safeParse(raw);
