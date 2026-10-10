# P01 — Monorepo & Data Layer

**Тип:** Phase Description  
**Статус:** Canonical  
**Версия:** 2.0  
**Дата:** 2026-05-23  
**Волна:** W16  
**Зависит от:** [`monorepo_boundaries_contract.md`](../contracts/monorepo_boundaries_contract.md), [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md)  
**Связанные документы:** [`P01_tasks.md`](../tasks/P01_tasks.md), [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md)

---

## Purpose

Фаза **P01** — monorepo workspaces и data layer: `@pulse/domain`, `@pulse/db` (Prisma v1), seed skeleton, `.env.example`. **Без** auth UI, proxy и product screens. После P01 — `npm run typecheck`, migrate applied, seed runs.

**Аудитория:** AI-агенты первой implementation-сессии после W16 docs.

---

## Agent context budget

| # | Document | Why |
|---|----------|-----|
| 1 | [`P01_tasks.md`](../tasks/P01_tasks.md) | Checklist |
| 2 | [`monorepo_boundaries_contract.md`](../contracts/monorepo_boundaries_contract.md) | PKG rules |
| 3 | [`database_schema_v1.md`](../../../prds/03_data_model/database_schema_v1.md) | Full DDL |
| 4 | [`seed_data_spec.md`](../../../prds/03_data_model/seed_data_spec.md) | Dev users |
| 5 | [`monorepo_packages.md`](../../../prds/05_runtime/monorepo_packages.md) | Package layout |
| 6 | [`neon_prisma_migrations_guide.md`](../guides/neon_prisma_migrations_guide.md) | Dual URL |
| 7 | [`ui_component_phase_matrix.md`](../ui_component_phase_matrix.md) | P01 row only |

**Wireframe:** none — infrastructure phase.

**MUST NOT read** other `P*_phase_description.md` in this session.

---

## Scope / Out of scope

### In scope

| Area | Deliverable |
|------|-------------|
| Monorepo | Root workspaces `apps/*`, `packages/*` |
| `@pulse/domain` | `UserRole`, `BookingStatus`, `MutationResult`, minimal Zod DTOs |
| `@pulse/db` | Prisma schema v1, client export, `directUrl` |
| Migrations | Initial migrate applied locally |
| Seed | Admin + client + pending trainer skeleton |
| Env | `.env.example` with `DATABASE_URL`, `DIRECT_URL` |

### Out of scope

- Auth.js, login/register (→ **P02**)
- `proxy.ts`, policy packages runtime (→ **P02**)
- App shell, Design Lab polish (→ **P03**)
- Product routes content (→ **P04+**)

---

## UI Catalog (this phase)

| Action | Component | Notes |
|--------|-----------|-------|
| — | **No product UI** | Packages + DB only |

---

## Cross-phase dependencies

| Dependency | Blocker? | Notes |
|------------|----------|-------|
| W16 docs complete | Yes | Phase numbering P01–P15 |
| Neon + env vars | Yes | Local `.env` |
| `apps/web` shell exists | No | P01 extends, not recreates |

---

## In-scope routes

None functional — file structure MAY be stubbed in P03. P01 focuses on `packages/` only.

---

## Implementation sequence

```mermaid
flowchart TD
  A[Workspaces scaffold] --> B[Prisma schema + migrate]
  B --> C[@pulse/domain enums]
  C --> D[Seed script skeleton]
  D --> E[typecheck + seed smoke]
```

---

## Happy path smoke

1. `npm run typecheck` (root) — pass.
2. `npm run lint` (root — `apps/web` + все `packages/*`) — pass.
3. `npx prisma migrate status` — applied.
3. `npm run db:seed` (or equivalent) — admin, client, pending trainer rows.
4. `@pulse/domain` imports work from `apps/web` typecheck (no runtime auth yet).

---

## Negative path smoke

| Scenario | Expected |
|----------|----------|
| Missing `DATABASE_URL` | Clear error on migrate/seed |
| Duplicate seed email | UNIQUE constraint — one row ([**FM-001**](../../../prds/02_domain_model/failure_modes_catalog.md)) |
| Schema drift vs DDL doc | Diff caught in review |

---

## Security smoke

| Check | Expected |
|-------|----------|
| `.env` in git | Not committed |
| Seed passwords | Dev-only; documented in seed guide |

---

## Concurrency & race check

| Scenario | Expected |
|----------|----------|
| Double seed run | Idempotent or safe upsert per seed spec |

---

## Drift risks & guards

| Risk | Guard |
|------|-------|
| Schema ↔ `database_schema_v1.md` | Prisma diff review each migration |
| FM-001 duplicate seed emails | UNIQUE on `user.email` |
| Package import graph | `monorepo_boundaries_contract` CI/typecheck |
| Phase scope creep into auth | P01 tasks — no Auth.js |

---

## Definition of done

- [ ] All `@pulse/domain`, `@pulse/db` scaffolded
- [ ] Prisma migrate applied; schema matches DDL doc
- [ ] Seed runs with all roles
- [ ] Post-MVP columns present, unused in app
- [ ] `npm run typecheck` pass
- [ ] `npm run lint` pass (root — all workspaces)
- [ ] Smoke checklist passed

---

## Related documents

| Document | Relationship |
|----------|--------------|
| [`P01_tasks.md`](../tasks/P01_tasks.md) | Checklist |
| [`P02_phase_description.md`](./P02_phase_description.md) | Next — auth |
| [`_migration_P01-P07_to_P01-P15.md`](./_migration_P01-P07_to_P01-P15.md) | W11 → W16 map |

---

## Agent notes

- **Одна сессия = P01 only.** Не начинать Auth.js или shell.
- Business logic in `packages/`, not `apps/web`.

---

## Acceptance criteria

- [ ] Packages + migrate + seed verified
- [ ] No auth, proxy, or product UI in PR scope
