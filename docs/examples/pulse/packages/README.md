# packages/

Shared monorepo packages — границы как в lampto.

| Package | Назначение | Статус |
|---------|------------|--------|
| `domain/` | Pure business rules, use-cases, ports | **P01** — types, guards, Zod DTOs |
| `policy/edge/` | JWT-only checks for proxy | **P02** — path classification, role matrix |
| `policy/server/` | Object-level ACL with Prisma | **P02** — stubs `assertCan*` |
| `db/` | Prisma schema, client, seed | **P01** — schema v1, migrate, seed |

**Reference:** [`docs/implementation/mvp/contracts/monorepo_boundaries_contract.md`](../docs/implementation/mvp/contracts/monorepo_boundaries_contract.md)

**Commands (root):**

```bash
npm run db:migrate      # prisma migrate dev
npm run db:seed         # dev fixtures
npm run db:migrate:status
npm run typecheck
npm run lint
```
