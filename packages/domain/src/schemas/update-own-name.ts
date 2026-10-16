import { z } from "zod";
import { personNameSchema } from "./person-name";

/** Own-name edits (access_requests §4) — no consent flag on the client payload. */
export const updateOwnNameInputSchema = personNameSchema.strict();

export type UpdateOwnNameInput = z.infer<typeof updateOwnNameInputSchema>;
