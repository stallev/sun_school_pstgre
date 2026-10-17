import { z } from "zod";
import { personNameSchema } from "./person-name";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "admin.people.birth_date_format" });

export const createPupilInputSchema = personNameSchema
  .extend({
    birthDate: isoDateSchema,
    isActive: z.boolean().default(true),
  })
  .strict();

export type CreatePupilInput = z.infer<typeof createPupilInputSchema>;

export const updatePupilInputSchema = personNameSchema
  .extend({
    pupilId: z.uuid(),
    birthDate: isoDateSchema,
    isActive: z.boolean(),
  })
  .strict();

export type UpdatePupilInput = z.infer<typeof updatePupilInputSchema>;

export const deactivatePupilInputSchema = z.object({ pupilId: z.uuid() }).strict();
export type DeactivatePupilInput = z.infer<typeof deactivatePupilInputSchema>;
