import type { MutationErrorCode } from "../constants/mutation-error-codes";

/**
 * Result of a mutation — canon: monorepo_boundaries_contract.md §7.
 * `message` is a dictionary KEY (resolved in the UI via @/lib/messages), never display text.
 * `fields` carries per-field message keys for VALIDATION.
 */
export type MutationOk<T = undefined> = [T] extends [undefined] ? { ok: true } : { ok: true; data: T };

export type MutationErr = {
  ok: false;
  code: MutationErrorCode;
  message?: string;
  fields?: Record<string, string>;
};

export type MutationResult<T = undefined> = MutationOk<T> | MutationErr;
