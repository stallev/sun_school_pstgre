import type { MutationErrorCode, MutationWarningCode } from "../constants/mutation-error-codes";

/**
 * Result of a mutation — canon: monorepo_boundaries_contract.md §7.
 * `message` is a dictionary KEY (resolved in the UI via @/lib/messages), never display text.
 * `fields` carries per-field message keys for VALIDATION; `warnings` flags a successful result
 * the UI should surface (e.g. `NO_GROUPS` when a TEACHER is approved without groups).
 */
export type MutationOk<T = undefined> = ([T] extends [undefined] ? { ok: true } : { ok: true; data: T }) & {
  warnings?: readonly MutationWarningCode[];
};

export type MutationErr = {
  ok: false;
  code: MutationErrorCode;
  message?: string;
  fields?: Record<string, string>;
};

export type MutationResult<T = undefined> = MutationOk<T> | MutationErr;
