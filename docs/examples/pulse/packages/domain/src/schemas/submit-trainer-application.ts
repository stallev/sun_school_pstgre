import { z } from "zod";

export const submitTrainerApplicationSchema = z.object({
  acceptedTerms: z.literal(true),
});

export type SubmitTrainerApplicationInput = z.infer<
  typeof submitTrainerApplicationSchema
>;
