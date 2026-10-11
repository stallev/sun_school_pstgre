/**
 * Mutation error codes — canon: docs/implementation/mvp/contracts/monorepo_boundaries_contract.md §8.
 * A new code is added here FIRST, then used in DAL / actions / UI (rule domain-literals-and-codes).
 * Module codes (ACCESS_, SCHOOL_, CHECK_, BRICKS_, DELETION_, BIBLE_) are added by the phases
 * that implement the owning contract.
 */
export const MUTATION_ERROR_CODES = {
  // §8.1 common
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION: "VALIDATION",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL: "INTERNAL",
  // AUTH_ — docs/prds/05_runtime/auth_runtime_spec.md §7
  AUTH_LINK_CONFLICT: "AUTH_LINK_CONFLICT",
  AUTH_LAST_IDENTITY: "AUTH_LAST_IDENTITY",
} as const;

export type MutationErrorCode = (typeof MUTATION_ERROR_CODES)[keyof typeof MUTATION_ERROR_CODES];

/** Allowed prefixes of module codes (contract §8.2). */
export const MUTATION_ERROR_CODE_PREFIXES = [
  "ACCESS_",
  "SCHOOL_",
  "CHECK_",
  "BRICKS_",
  "DELETION_",
  "BIBLE_",
  "AUTH_",
] as const;
