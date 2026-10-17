import { z } from "zod";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "admin.people.enroll_date_format" });

export const enrollPupilInputSchema = z
  .object({
    pupilId: z.uuid(),
    gradeId: z.uuid(),
    startsOn: isoDateSchema,
  })
  .strict();

export type EnrollPupilInput = z.infer<typeof enrollPupilInputSchema>;

export const unenrollPupilInputSchema = z
  .object({
    pupilId: z.uuid(),
    endsOn: isoDateSchema,
  })
  .strict();

export type UnenrollPupilInput = z.infer<typeof unenrollPupilInputSchema>;

export const transferPupilInputSchema = z
  .object({
    pupilId: z.uuid(),
    toGradeId: z.uuid(),
    onDate: isoDateSchema,
  })
  .strict();

export type TransferPupilInput = z.infer<typeof transferPupilInputSchema>;
