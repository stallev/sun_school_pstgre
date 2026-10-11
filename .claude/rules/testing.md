---
description: Tests (Vitest unit/integration) — scope per quality profile (lean), placement, contract-driven assertions
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/vitest.config.*"
---
# Testing

**Guide:** [`docs/guidelines/testing/ai_testing_guidelines.md`](docs/guidelines/testing/ai_testing_guidelines.md)
**Scope per level:** [`docs/meta/project_quality_profile.md`](docs/meta/project_quality_profile.md) — D4 unit / integration, D5 e2e, D7 where they run (no profile → `standard`)

## Profile `lean` (this project)

| Dimension | Value |
|-----------|-------|
| D4 | Unit tests in `packages/domain`; policy checks for **S paths** (`packages/policy/server`: allow / foreign resource → `NOT_FOUND` / wrong role → `FORBIDDEN`); integration on a DB copy only where the contract demands (seed, migrations, use-case races). No coverage threshold |
| D5 | **No e2e**; the manual smoke steps are in the task's Acceptance |
| D7 | `npm run typecheck` + `npm run lint` + `npm run test` locally before the commit |

## Contract

- Write the tests the profile level requires — no more by default, no less. Missing required test for a task = task not done.
- Unit test sits next to the code (`*.test.ts`).
- Expected outcomes come from the contract / spec `§` the task links, not from the implementation.
- N / S paths assert domain codes (`MUTATION_ERROR_CODES.*`, `AUTH_*`, `CHECK_*` … from `@sunschool/domain`) — no string literals.
- Time-dependent rules (`computeLate`, deadlines) take the clock and the school time zone as input — no `Date.now()` in the unit under test.
- Unit tests touch no network and no real database; external services go through domain ports and fakes.
- Flaky test → fix the cause; do not add retries to hide it.

## Do not

- Lower thresholds or delete a failing test to make `test` green.
- Snapshot-only tests for logic.
- Test files outside the CU of the code they cover.
- Put real personal data of pupils or teachers into fixtures — use synthetic names.
