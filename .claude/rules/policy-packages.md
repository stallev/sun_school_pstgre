---
description: Policy packages — @sunschool/policy-server vs @sunschool/policy-edge
paths:
  - "packages/policy/**"
  - "apps/web/src/data/**"
  - "apps/web/src/actions/**"
  - "apps/web/src/app/api/**"
  - "apps/web/src/proxy.ts"
  - "apps/web/src/middleware.ts"
---
# Policy packages (`@sunschool/policy-server`, `@sunschool/policy-edge`)

**Methodology:** [`docs/meta/ai_first_project_methodology.md`](docs/meta/ai_first_project_methodology.md)  
**Runtime:** [ADR-002](docs/prds/07_governance/adr_002_nextjs_vercel_runtime_policy.md) — **`proxy.ts`** is canonical interception file

## `@sunschool/policy-server`

- **Use for:** Prisma-backed object-level checks
- **Import from:** Route Handlers, Server Actions, RSC loaders, `apps/web/src/data/**`
- **Forbidden:** `proxy.ts`, `middleware.ts`, Edge runtime, `'use client'`
- **API shape:** Pure functions — no `redirect()` inside policy-server
- **Types:** `PolicySessionContext` / `UserRole` from `@sunschool/domain`

## `@sunschool/policy-edge`

- **Use for:** JWT/path classification **without DB**
- **Must not** depend on `@sunschool/db` or `@sunschool/policy-server`
- **Allowed in:** **`proxy.ts`** (Next.js 16 canonical) and transitional `middleware.ts`

## Next.js 16 note

`proxy.ts` runs on **Node.js runtime**, not Edge — still must not import Prisma/policy-server. JWT-only checks via policy-edge + auth.config.


## Project rules

- **Matrix:** every check maps to an `AZ-*` row of [`authorization_matrix.md`](docs/prds/04_authorization_privacy/authorization_matrix.md); foreign resource → `NOT_FOUND` (AZ-D4), wrong role → `FORBIDDEN` (AZ-D3).
- **Roles:** `admin`, `teacher` only; teacher scope = groups of the active assignments (AZ-P5), closed school year = read-only for teacher (AZ-P6).
- **Return shape:** policy functions return a typed decision; the use-case turns it into `MutationResult` — no `redirect()` or `notFound()` inside packages.
- **S paths:** each `policy-server` function has a unit test for allow / foreign-resource / wrong-role (profile D4).
- **Auth source:** `PolicySessionContext` is built by `requireActiveUser()` from the DB — see **auth-security**.

Reference: Pulse (docs/examples/pulse) `policy-packages.mdc` — layer split only; project rules above override.
