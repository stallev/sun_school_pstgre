import type { ZodError } from "zod";
import { MUTATION_ERROR_CODES, type MutationErr } from "@sunschool/domain";

/** Maps Zod issue paths to dictionary keys in `fields` for VALIDATION responses. */
export const mutationFromZodError = (error: ZodError): MutationErr => {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in fields)) {
      fields[key] = issue.message;
    }
  }
  return { ok: false, code: MUTATION_ERROR_CODES.VALIDATION, fields };
};
